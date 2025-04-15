"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const formSchema = z.object({
  sourceWarehouseId: z.string({
    required_error: "Please select a source warehouse.",
  }),
  destinationWarehouseId: z.string({
    required_error: "Please select a destination warehouse.",
  }),
  productId: z.string({
    required_error: "Please select a product.",
  }),
  quantity: z.coerce
    .number({
      required_error: "Please enter a quantity.",
      invalid_type_error: "Quantity must be a number.",
    })
    .positive({
      message: "Quantity must be positive.",
    }),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CreateStockTransferSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (transferData: {
    sourceWarehouseId: string
    destinationWarehouseId: string
    items: Array<{ productId: string; quantity: number }>
    notes?: string
  }) => Promise<void>
  warehouses: Array<{ id: string; name: string }>
}

export function CreateStockTransferSheet({ open, onOpenChange, onSubmit, warehouses }: CreateStockTransferSheetProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
    },
  })

  async function onSubmitForm(values: FormValues) {
    try {
      setIsSubmitting(true)

      // Format data for API - convert single product/quantity to items array
      const transferData = {
        sourceWarehouseId: values.sourceWarehouseId,
        destinationWarehouseId: values.destinationWarehouseId,
        items: [
          {
            productId: values.productId,
            quantity: values.quantity
          }
        ],
        notes: values.notes
      }

      // Call the provided onSubmit function with the transfer data
      await onSubmit(transferData)

      // Reset form
      form.reset()

      // Close sheet
      onOpenChange(false)

      // Show success toast
      toast.success("Stock transfer created", {
        description: "The stock transfer has been created successfully.",
      })

      // Refresh data
      router.refresh()
    } catch (error) {
      console.error("Error creating stock transfer:", error)
      toast.error("Error",{
        description: "Failed to create stock transfer. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mock data for products
  const products = [
    { id: "1", name: "Product A" },
    { id: "2", name: "Product B" },
    { id: "3", name: "Product C" },
    { id: "4", name: "Product D" },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Create Stock Transfer</SheetTitle>
          <SheetDescription>
            Transfer stock between warehouses. This will update the stock levels in both warehouses.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="sourceWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Warehouse</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select source warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>The warehouse where the stock is currently located.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destinationWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Warehouse</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select destination warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>The warehouse where the stock will be transferred to.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>The product to transfer between warehouses.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter quantity" {...field} />
                      </FormControl>
                      <FormDescription>The quantity of the product to transfer.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes about this transfer"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Optional notes about this stock transfer.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className="pt-4">
                <SheetClose asChild>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Transfer"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
