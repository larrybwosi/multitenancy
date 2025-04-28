"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, Plus, Trash2, Loader2, PackageOpen } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { FormWrapper } from "@/components/form-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define the schema for bulk restock
const restockSchema = z.object({
  locationId: z.string().min(1, "Destination location is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  reference: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  deliveryDate: z.date().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        variantId: z.string().optional(),
        quantity: z.coerce.number().int().positive("Quantity must be positive"),
        costPrice: z.coerce.number().nonnegative("Cost price must be non-negative"),
        batchNumber: z.string().optional(),
        expiryDate: z.date().optional().nullable(),
      }),
    )
    .min(1, "At least one item is required"),
})

type RestockFormValues = z.infer<typeof restockSchema>

interface Location {
  id: string
  name: string
  warehouse: {
    id: string
    name: string
  }
  zone?: {
    id: string
    name: string
  } | null
}

interface Supplier {
  id: string
  name: string
  products?: {
    id: string
    productId: string
    supplierSku?: string
    costPrice: number
  }[]
}

interface Product {
  id: string
  name: string
  sku: string
  baseCost?: number
  variants?: {
    id: string
    name: string
    sku?: string
  }[]
}

export function BulkRestockForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [supplierProducts, setSupplierProducts] = useState<Record<string, any[]>>({})
  const [isLoadingSupplierProducts, setIsLoadingSupplierProducts] = useState(false)

  const form = useForm<RestockFormValues>({
    resolver: zodResolver(restockSchema),
    defaultValues: {
      locationId: "",
      supplierId: "",
      reference: `PO-${Date.now().toString().slice(-6)}`,
      purchaseOrderNumber: "",
      notes: "",
      items: [{ productId: "", quantity: 1, costPrice: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  // Fetch locations, suppliers and products on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch locations
        const locationsResponse = await fetch("/api/locations?limit=100")
        if (!locationsResponse.ok) throw new Error("Failed to fetch locations")
        const locationsData = await locationsResponse.json()
        setLocations(locationsData.data.locations)

        // Fetch suppliers
        const suppliersResponse = await fetch("/api/suppliers?limit=100")
        if (!suppliersResponse.ok) throw new Error("Failed to fetch suppliers")
        const suppliersData = await suppliersResponse.json()
        setSuppliers(suppliersData.data.suppliers)

        // Fetch products
        const productsResponse = await fetch("/api/products?limit=100")
        if (!productsResponse.ok) throw new Error("Failed to fetch products")
        const productsData = await productsResponse.json()
        setProducts(productsData.data.products)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load data", {
          description: "Please refresh the page and try again.",
        })
      }
    }

    fetchData()
  }, [])

  // Fetch supplier products when supplier is selected
  useEffect(() => {
    if (!selectedSupplier) return

    const fetchSupplierProducts = async () => {
      setIsLoadingSupplierProducts(true)
      try {
        const response = await fetch(`/api/suppliers/${selectedSupplier}/products`)
        if (!response.ok) throw new Error("Failed to fetch supplier products")
        const data = await response.json()

        setSupplierProducts((prev) => ({
          ...prev,
          [selectedSupplier]: data.data.products || [],
        }))
      } catch (error) {
        console.error("Error fetching supplier products:", error)
        toast.error("Failed to load supplier products")
      } finally {
        setIsLoadingSupplierProducts(false)
      }
    }

    if (!supplierProducts[selectedSupplier]) {
      fetchSupplierProducts()
    }
  }, [selectedSupplier, supplierProducts])

  // Handle supplier change
  const handleSupplierChange = (supplierId: string) => {
    form.setValue("supplierId", supplierId)
    setSelectedSupplier(supplierId)

    // Reset items when changing supplier
    form.setValue("items", [{ productId: "", quantity: 1, costPrice: 0 }])
  }

  // Get product name by ID
  const getProductName = (productId: string, variantId?: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return "Unknown Product"

    if (variantId) {
      const variant = product.variants?.find((v) => v.id === variantId)
      return variant ? `${product.name} - ${variant.name}` : product.name
    }

    return product.name
  }

  // Get supplier product cost
  const getSupplierProductCost = (productId: string) => {
    if (!selectedSupplier || !supplierProducts[selectedSupplier]) return 0

    const supplierProduct = supplierProducts[selectedSupplier].find((p) => p.productId === productId)

    return supplierProduct?.costPrice || 0
  }

  // Handle product selection
  const handleProductSelection = (productId: string, index: number) => {
    form.setValue(`items.${index}.productId`, productId)

    // Set cost price from supplier product if available
    const costPrice = getSupplierProductCost(productId)
    if (costPrice > 0) {
      form.setValue(`items.${index}.costPrice`, costPrice)
    } else {
      // Otherwise use product base cost
      const product = products.find((p) => p.id === productId)
      form.setValue(`items.${index}.costPrice`, product?.baseCost || 0)
    }
  }

  // Handle form submission
  const onSubmit = async (data: RestockFormValues) => {
    setIsSubmitting(true)

    try {
      // Submit the restock
      const response = await fetch("/api/inventory/restock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          initiatedBy: "System User", // This would come from auth context in a real app
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create restock")
      }

      const result = await response.json()

      toast.success("Restock completed successfully", {
        description: `Reference: ${result.data.reference || "N/A"}`,
      })

      // Redirect to inventory list
      router.push("/inventory")
    } catch (error) {
      console.error("Error creating restock:", error)
      toast.error("Failed to create restock", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Restock</h1>
      </div>

      <FormWrapper methods={form} onSubmit={onSubmit}>
        <div className="grid gap-6">
          <Card className="card-hover-effect animate-slide-in-up">
            <CardHeader>
              <CardTitle>Restock Details</CardTitle>
              <CardDescription>Enter the details for this bulk restock</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={(value) => handleSupplierChange(value)} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Select the supplier for this restock</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.warehouse.name} - {location.name}
                              {location.zone && ` (${location.zone.name})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Select the location to receive this stock</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter reference number" />
                      </FormControl>
                      <FormDescription>Internal reference for this restock</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchaseOrderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Order Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter PO number" />
                      </FormControl>
                      <FormDescription>Optional purchase order reference</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Delivery Date</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} />
                      <FormDescription>Date when the stock was delivered</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter any additional notes about this restock" />
                    </FormControl>
                    <FormDescription>Optional notes about this restock</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="card-hover-effect animate-slide-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Restock Items</CardTitle>
                <CardDescription>Add the items to be restocked</CardDescription>
              </div>
              {isLoadingSupplierProducts && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading supplier products...
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedSupplier && (
                <Alert>
                  <PackageOpen className="h-4 w-4" />
                  <AlertTitle>Select a supplier</AlertTitle>
                  <AlertDescription>
                    Please select a supplier to view available products for restocking.
                  </AlertDescription>
                </Alert>
              )}

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-[1fr_1fr_auto] animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field: productField }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <Select
                            onValueChange={(value) => handleProductSelection(value, index)}
                            value={productField.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} ({product.sku || "No SKU"})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Variant selection if the product has variants */}
                    {form.watch(`items.${index}.productId`) &&
                      products.find((p) => p.id === form.watch(`items.${index}.productId`))?.variants?.length > 0 && (
                        <FormField
                          control={form.control}
                          name={`items.${index}.variantId`}
                          render={({ field: variantField }) => (
                            <FormItem>
                              <FormLabel>Variant</FormLabel>
                              <Select onValueChange={variantField.onChange} value={variantField.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select variant" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products
                                    .find((p) => p.id === form.watch(`items.${index}.productId`))
                                    ?.variants?.map((variant) => (
                                      <SelectItem key={variant.id} value={variant.id}>
                                        {variant.name} {variant.sku ? `(${variant.sku})` : ""}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field: quantityField }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...quantityField}
                              onChange={(e) => quantityField.onChange(Number.parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.costPrice`}
                      render={({ field: costField }) => (
                        <FormItem>
                          <FormLabel>Cost Price</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="pl-8"
                                {...costField}
                                onChange={(e) => costField.onChange(Number.parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.batchNumber`}
                      render={({ field: batchField }) => (
                        <FormItem>
                          <FormLabel>Batch Number</FormLabel>
                          <FormControl>
                            <Input {...batchField} placeholder="Optional" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.expiryDate`}
                      render={({ field: expiryField }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <DatePicker date={expiryField.value} setDate={expiryField.onChange} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove item</span>
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => append({ productId: "", quantity: 1, costPrice: 0 })}
                disabled={!selectedSupplier}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/inventory">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Complete Restock"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </FormWrapper>
    </div>
  )
}
