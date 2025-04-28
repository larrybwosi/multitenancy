"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, Plus, Trash2, Loader2, ArrowRightLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FormWrapper } from "@/components/form-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define the schema for stock transfer
const transferSchema = z.object({
  fromLocationId: z.string().min(1, "Source location is required"),
  toLocationId: z.string().min(1, "Destination location is required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        variantId: z.string().optional(),
        quantity: z.coerce.number().int().positive("Quantity must be positive"),
        batchNumber: z.string().optional(),
      }),
    )
    .min(1, "At least one item is required"),
})

type TransferFormValues = z.infer<typeof transferSchema>

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

interface Product {
  id: string
  name: string
  sku: string
  variants?: {
    id: string
    name: string
    sku?: string
  }[]
}

interface InventoryItem {
  productId: string
  variantId?: string | null
  quantity: number
  availableQty: number
  batchNumber?: string | null
}

export function CreateTransferForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedFromLocation, setSelectedFromLocation] = useState<string | null>(null)
  const [inventoryByLocation, setInventoryByLocation] = useState<Record<string, InventoryItem[]>>({})
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromLocationId: "",
      toLocationId: "",
      reference: `TRF-${Date.now().toString().slice(-6)}`,
      notes: "",
      items: [{ productId: "", quantity: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  // Fetch locations and products on component mount
  useEffect(() => {
    const fetchLocationsAndProducts = async () => {
      try {
        // Fetch locations
        const locationsResponse = await fetch("/api/locations?limit=100")
        if (!locationsResponse.ok) throw new Error("Failed to fetch locations")
        const locationsData = await locationsResponse.json()
        setLocations(locationsData.data.locations)

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

    fetchLocationsAndProducts()
  }, [])

  // Fetch inventory for selected location
  useEffect(() => {
    if (!selectedFromLocation) return

    const fetchInventory = async () => {
      setIsLoadingInventory(true)
      try {
        const response = await fetch(`/api/inventory?locationId=${selectedFromLocation}&limit=500`)
        if (!response.ok) throw new Error("Failed to fetch inventory")
        const data = await response.json()

        // Organize inventory by location
        const inventory = data.data.inventory || []
        setInventoryByLocation((prev) => ({
          ...prev,
          [selectedFromLocation]: inventory.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            availableQty: item.availableQty,
            batchNumber: item.batchNumber,
          })),
        }))
      } catch (error) {
        console.error("Error fetching inventory:", error)
        toast.error("Failed to load inventory data")
      } finally {
        setIsLoadingInventory(false)
      }
    }

    if (!inventoryByLocation[selectedFromLocation]) {
      fetchInventory()
    }
  }, [selectedFromLocation, inventoryByLocation])

  // Handle from location change
  const handleFromLocationChange = (locationId: string) => {
    form.setValue("fromLocationId", locationId)
    setSelectedFromLocation(locationId)

    // Reset items when changing location
    form.setValue("items", [{ productId: "", quantity: 1 }])
  }

  // Check if a product is available in the selected location
  const isProductAvailable = (productId: string, variantId?: string) => {
    if (!selectedFromLocation || !inventoryByLocation[selectedFromLocation]) return false

    return inventoryByLocation[selectedFromLocation].some(
      (item) =>
        item.productId === productId &&
        ((!variantId && !item.variantId) || variantId === item.variantId) &&
        item.availableQty > 0,
    )
  }

  // Get available quantity for a product in the selected location
  const getAvailableQuantity = (productId: string, variantId?: string) => {
    if (!selectedFromLocation || !inventoryByLocation[selectedFromLocation]) return 0

    const item = inventoryByLocation[selectedFromLocation].find(
      (item) => item.productId === productId && ((!variantId && !item.variantId) || variantId === item.variantId),
    )

    return item?.availableQty || 0
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

  // Handle form submission
  const onSubmit = async (data: TransferFormValues) => {
    setIsSubmitting(true)

    try {
      // Validate that source and destination are different
      if (data.fromLocationId === data.toLocationId) {
        toast.error("Source and destination locations cannot be the same")
        setIsSubmitting(false)
        return
      }

      // Validate available quantities
      for (const item of data.items) {
        const availableQty = getAvailableQuantity(item.productId, item.variantId)
        if (item.quantity > availableQty) {
          toast.error(`Insufficient quantity for ${getProductName(item.productId, item.variantId)}`, {
            description: `Available: ${availableQty}, Requested: ${item.quantity}`,
          })
          setIsSubmitting(false)
          return
        }
      }

      // Submit the transfer
      const response = await fetch("/api/transfers", {
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
        throw new Error(errorData.message || "Failed to create transfer")
      }

      const result = await response.json()

      toast.success("Transfer created successfully", {
        description: `Transfer reference: ${result.data.reference || "N/A"}`,
      })

      // Redirect to transfers list
      router.push("/transfers")
    } catch (error) {
      console.error("Error creating transfer:", error)
      toast.error("Failed to create transfer", {
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
          <Link href="/transfers">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New Stock Transfer</h1>
      </div>

      <FormWrapper methods={form} onSubmit={onSubmit}>
        <div className="grid gap-6">
          <Card className="card-hover-effect animate-slide-in-up">
            <CardHeader>
              <CardTitle>Transfer Details</CardTitle>
              <CardDescription>Enter the details for this stock transfer</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fromLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Location</FormLabel>
                      <Select onValueChange={(value) => handleFromLocationChange(value)} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source location" />
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
                      <FormDescription>Select the source location for this transfer</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations
                            .filter((location) => location.id !== form.watch("fromLocationId"))
                            .map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.warehouse.name} - {location.name}
                                {location.zone && ` (${location.zone.name})`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Select the destination location for this transfer</FormDescription>
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
                      <FormDescription>Optional reference number for this transfer</FormDescription>
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
                      <Textarea {...field} placeholder="Enter any additional notes about this transfer" />
                    </FormControl>
                    <FormDescription>Optional notes about this stock transfer</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="card-hover-effect animate-slide-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transfer Items</CardTitle>
                <CardDescription>Add the items to be transferred</CardDescription>
              </div>
              {isLoadingInventory && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading inventory...
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedFromLocation && (
                <Alert>
                  <ArrowRightLeft className="h-4 w-4" />
                  <AlertTitle>Select a source location</AlertTitle>
                  <AlertDescription>
                    Please select a source location to view available inventory for transfer.
                  </AlertDescription>
                </Alert>
              )}

              {selectedFromLocation && inventoryByLocation[selectedFromLocation]?.length === 0 && (
                <Alert>
                  <AlertTitle>No inventory available</AlertTitle>
                  <AlertDescription>There are no items available for transfer from this location.</AlertDescription>
                </Alert>
              )}

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-[1fr_auto_auto] animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field: productField }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <Select onValueChange={productField.onChange} value={productField.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products
                                .filter((product) => isProductAvailable(product.id))
                                .map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} ({product.sku || "No SKU"})
                                    <Badge className="ml-2" variant="outline">
                                      {getAvailableQuantity(product.id)} available
                                    </Badge>
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
                                    ?.variants?.filter((variant) =>
                                      isProductAvailable(form.watch(`items.${index}.productId`), variant.id),
                                    )
                                    .map((variant) => (
                                      <SelectItem key={variant.id} value={variant.id}>
                                        {variant.name} {variant.sku ? `(${variant.sku})` : ""}
                                        <Badge className="ml-2" variant="outline">
                                          {getAvailableQuantity(form.watch(`items.${index}.productId`), variant.id)}{" "}
                                          available
                                        </Badge>
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

                  <div className="space-y-2">
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
                              max={getAvailableQuantity(
                                form.watch(`items.${index}.productId`),
                                form.watch(`items.${index}.variantId`),
                              )}
                              {...quantityField}
                              onChange={(e) => quantityField.onChange(Number.parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="mt-auto"
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
                onClick={() => append({ productId: "", quantity: 1 })}
                disabled={!selectedFromLocation || inventoryByLocation[selectedFromLocation]?.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/transfers">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Transfer"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </FormWrapper>
    </div>
  )
}
