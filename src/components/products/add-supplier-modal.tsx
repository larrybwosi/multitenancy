"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Check, Loader2 } from "lucide-react"

import { ProductSupplierSchema } from "@/lib/schemas/product-schema"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { FormProvider } from "@/components/form-provider"

interface AddSupplierModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (supplier: any) => void
}

export function AddSupplierModal({ open, onOpenChange, onAdd }: AddSupplierModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock suppliers data
  const suppliers = [
    { id: "supplier1", name: "Acme Supplies" },
    { id: "supplier2", name: "Global Distribution Inc." },
    { id: "supplier3", name: "Tech Parts Ltd." },
    { id: "supplier4", name: "Quality Goods Co." },
  ]

  const form = useForm({
    resolver: zodResolver(ProductSupplierSchema),
    defaultValues: {
      supplierId: "",
      supplierSku: "",
      costPrice: 0,
      minimumOrderQuantity: null,
      packagingUnit: "",
      isPreferred: false,
    },
  })

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = form

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      onAdd(data)
      reset()
    } catch (error) {
      console.error("Error adding supplier:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] animate-scale-in">
        <FormProvider methods={form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Add Product Supplier</DialogTitle>
              <DialogDescription>Link a supplier to this product and specify purchasing details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a supplier" />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="supplierSku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Supplier's product code" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>The product code used by the supplier</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="minimumOrderQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Order Qty</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number.parseInt(e.target.value) : null)}
                          value={field.value === null ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="packagingUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packaging Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Box of 12" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="isPreferred"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Preferred Supplier</FormLabel>
                      <FormDescription>Mark this as your preferred supplier for this product</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Add Supplier
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
