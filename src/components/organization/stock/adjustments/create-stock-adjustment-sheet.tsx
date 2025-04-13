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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  warehouseId: z.string({
    required_error: "Please select a warehouse.",
  }),
  productId: z.string({
    required_error: "Please select a product.",
  }),
  adjustmentType: z.enum(["increase", "decrease"], {
    required_error: "Please select an adjustment type.",
  }),
  quantity: z.coerce
    .number({
      required_error: "Please enter a quantity.",
      invalid_type_error: "Quantity must be a number.",
    })
    .positive({
      message: "Quantity must be positive.",
    }),
  reason: z.string({
    required_error: "Please select a reason.",
  }),
  notes: z.string().optional(),
})

interface CreateStockAdjustmentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateStockAdjustmentSheet({ open, onOpenChange }: CreateStockAdjustmentSheetProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adjustmentType: "increase",
      notes: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Log the adjustment details for debugging
      console.log("Adjustment details:", values)

      // Show success toast
      toast({
        title: "Stock adjustment created",
        description: "The stock adjustment has been created successfully.",
      })

      // Reset form
      form.reset()

      // Close sheet
      onOpenChange(false)

      // Refresh data
      router.refresh()
    } catch (error) {
      console.error("Error creating stock adjustment:", error)
      toast({
        title: "Error",
        description: "Failed to create stock adjustment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mock data for warehouses, products, and reasons
  const warehouses = [
    { id: "1", name: "Main Warehouse" },
    { id: "2", name: "Secondary Warehouse" },
    { id: "3", name: "Distribution Center" },
    { id: "4", name: "Retail Storage" },
  ]

  const products = [
    { id: "1", name: "Product A" },
    { id: "2", name: "Product B" },
    { id: "3", name: "Product C" },
    { id: "4", name: "Product D" },
  ]

  const reasons = [
    { id: "damaged", name: "Damaged Goods" },
    { id: "expired", name: "Expired Products" },
    { id: "count", name: "Count Adjustment" },
    { id: "return", name: "Customer Return" },
    { id: "theft", name: "Theft or Loss" },
    { id: "quality", name: "Quality Control" },
    { id: "other", name: "Other" },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Create Stock Adjustment</SheetTitle>
          <SheetDescription>
            Adjust stock levels to account for discrepancies, damages, or other reasons.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warehouse</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select warehouse" />
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
                      <FormDescription>The warehouse where the stock adjustment will be made.</FormDescription>
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
                      <FormDescription>The product to adjust stock levels for.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adjustmentType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Adjustment Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="increase" />
                            </FormControl>
                            <FormLabel className="font-normal">Increase Stock</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="decrease" />
                            </FormControl>
                            <FormLabel className="font-normal">Decrease Stock</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>Whether to increase or decrease the stock level.</FormDescription>
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
                      <FormDescription>The quantity to adjust by (positive number).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            {reasons.map((reason) => (
                              <SelectItem key={reason.id} value={reason.id}>
                                {reason.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>The reason for the stock adjustment.</FormDescription>
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
                          placeholder="Add any additional notes about this adjustment"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Optional notes about this stock adjustment.</FormDescription>
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
                  {isSubmitting ? "Creating..." : "Create Adjustment"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
