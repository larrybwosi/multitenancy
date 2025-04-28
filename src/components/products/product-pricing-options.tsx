"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormWrapper } from "@/components/form-provider"
import { Badge } from "@/components/ui/badge"

// Define the schema for product pricing
const pricingSchema = z.object({
  retail: z.array(
    z.object({
      priceListId: z.string(),
      price: z.coerce.number().nonnegative("Price must be non-negative"),
      minQuantity: z.coerce.number().int().positive().default(1),
    }),
  ),
  wholesale: z.array(
    z.object({
      priceListId: z.string(),
      price: z.coerce.number().nonnegative("Price must be non-negative"),
      minQuantity: z.coerce.number().int().positive().default(1),
    }),
  ),
})

type PricingFormValues = z.infer<typeof pricingSchema>

interface PriceList {
  id: string
  name: string
  type: string
  isDefault: boolean
}

interface ProductPricingOptionsProps {
  productId: string
  variantId?: string
  basePrice: number
}

export function ProductPricingOptions({ productId, variantId, basePrice }: ProductPricingOptionsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [priceLists, setPriceLists] = useState<PriceList[]>([])
  const [existingPrices, setExistingPrices] = useState<any[]>([])

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      retail: [{ priceListId: "", price: basePrice, minQuantity: 1 }],
      wholesale: [],
    },
  })

  // Fetch price lists and existing prices on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch price lists
        const priceListsResponse = await fetch("/api/price-lists?limit=100")
        if (!priceListsResponse.ok) throw new Error("Failed to fetch price lists")
        const priceListsData = await priceListsResponse.json()
        setPriceLists(priceListsData.data.priceLists)

        // Fetch existing prices for this product/variant
        const pricesResponse = await fetch(`/api/products/${productId}/prices`)
        if (!pricesResponse.ok) throw new Error("Failed to fetch product prices")
        const pricesData = await pricesResponse.json()
        setExistingPrices(pricesData.data.prices || [])

        // Organize existing prices by type
        const retailPrices = pricesData.data.prices
          .filter((p: any) => p.priceList.type === "retail" && (!variantId || p.variantId === variantId))
          .map((p: any) => ({
            priceListId: p.priceListId,
            price: p.price,
            minQuantity: p.minQuantity,
          }))

        const wholesalePrices = pricesData.data.prices
          .filter((p: any) => p.priceList.type === "wholesale" && (!variantId || p.variantId === variantId))
          .map((p: any) => ({
            priceListId: p.priceListId,
            price: p.price,
            minQuantity: p.minQuantity,
          }))

        // Set form values with existing prices or defaults
        form.reset({
          retail:
            retailPrices.length > 0
              ? retailPrices
              : [
                  {
                    priceListId: priceLists.find((pl) => pl.type === "retail" && pl.isDefault)?.id || "",
                    price: basePrice,
                    minQuantity: 1,
                  },
                ],
          wholesale: wholesalePrices.length > 0 ? wholesalePrices : [],
        })
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load pricing data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [productId, variantId, basePrice, form])

  // Add retail price
  const addRetailPrice = () => {
    const retail = form.getValues("retail")
    form.setValue("retail", [...retail, { priceListId: "", price: basePrice, minQuantity: 1 }])
  }

  // Remove retail price
  const removeRetailPrice = (index: number) => {
    const retail = form.getValues("retail")
    form.setValue(
      "retail",
      retail.filter((_, i) => i !== index),
    )
  }

  // Add wholesale price
  const addWholesalePrice = () => {
    const wholesale = form.getValues("wholesale")
    form.setValue("wholesale", [...wholesale, { priceListId: "", price: basePrice * 0.8, minQuantity: 10 }])
  }

  // Remove wholesale price
  const removeWholesalePrice = (index: number) => {
    const wholesale = form.getValues("wholesale")
    form.setValue(
      "wholesale",
      wholesale.filter((_, i) => i !== index),
    )
  }

  // Handle form submission
  const onSubmit = async (data: PricingFormValues) => {
    setIsSaving(true)

    try {
      // Combine retail and wholesale prices
      const allPrices = [
        ...data.retail.map((p) => ({ ...p, variantId })),
        ...data.wholesale.map((p) => ({ ...p, variantId })),
      ]

      // Submit prices
      const response = await fetch(`/api/products/${productId}/prices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(allPrices),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save prices")
      }

      toast.success("Pricing options saved successfully")
    } catch (error) {
      console.error("Error saving prices:", error)
      toast.error("Failed to save pricing options", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const retailPriceLists = priceLists.filter((pl) => pl.type === "retail")
  const wholesalePriceLists = priceLists.filter((pl) => pl.type === "wholesale")

  return (
    <Card className="card-hover-effect animate-slide-in-up">
      <CardHeader>
        <CardTitle>Pricing Options</CardTitle>
        <CardDescription>Set different pricing strategies for this product</CardDescription>
      </CardHeader>
      <CardContent>
        <FormWrapper methods={form} onSubmit={onSubmit}>
          <Tabs defaultValue="retail" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="retail">
                Retail Pricing
                {form.watch("retail").length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {form.watch("retail").length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="wholesale">
                Wholesale Pricing
                {form.watch("wholesale").length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {form.watch("wholesale").length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="retail" className="space-y-4 pt-4">
              {form.watch("retail").map((_, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
                  <FormField
                    control={form.control}
                    name={`retail.${index}.priceListId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price List</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select price list" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {retailPriceLists.map((priceList) => (
                              <SelectItem key={priceList.id} value={priceList.id}>
                                {priceList.name}
                                {priceList.isDefault && " (Default)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`retail.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="pl-8"
                              {...field}
                              onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeRetailPrice(index)}
                    disabled={form.watch("retail").length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove price</span>
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addRetailPrice}
                disabled={retailPriceLists.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Retail Price
              </Button>
            </TabsContent>

            <TabsContent value="wholesale" className="space-y-4 pt-4">
              {form.watch("wholesale").length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No wholesale pricing options added yet.</div>
              ) : (
                form.watch("wholesale").map((_, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
                    <FormField
                      control={form.control}
                      name={`wholesale.${index}.priceListId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price List</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select price list" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {wholesalePriceLists.map((priceList) => (
                                <SelectItem key={priceList.id} value={priceList.id}>
                                  {priceList.name}
                                  {priceList.isDefault && " (Default)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`wholesale.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="pl-8"
                                {...field}
                                onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`wholesale.${index}.minQuantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min. Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="button" variant="outline" size="icon" onClick={() => removeWholesalePrice(index)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove price</span>
                    </Button>
                  </div>
                ))
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addWholesalePrice}
                disabled={wholesalePriceLists.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Wholesale Price
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Pricing Options"
              )}
            </Button>
          </div>
        </FormWrapper>
      </CardContent>
    </Card>
  )
}
