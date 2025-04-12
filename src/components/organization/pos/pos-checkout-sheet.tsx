"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Banknote, Wallet } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  customer: z.string().optional(),
  paymentMethod: z.enum(["CASH", "CREDIT_CARD", "DIGITAL_WALLET"]),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface POSCheckoutSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: any[]
  cartTotal: number
  onCheckout: (data: FormValues) => Promise<boolean>
}

export function POSCheckoutSheet({ open, onOpenChange, customers, cartTotal, onCheckout }: POSCheckoutSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: "",
      paymentMethod: "CREDIT_CARD",
      notes: "",
    },
  })

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      const success = await onCheckout(values)
      if (success) {
        form.reset()
        onOpenChange(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Checkout</SheetTitle>
          <SheetDescription>Complete the sale by selecting payment options.</SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Total Amount</span>
                  <span className="font-bold text-lg">{formatCurrency(cartTotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">This amount includes all applicable taxes and fees.</p>
              </div>

              <FormField
                control={form.control}
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer or leave blank for guest" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Guest</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.name}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="CREDIT_CARD" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Credit Card
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="CASH" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <Banknote className="mr-2 h-4 w-4" />
                            Cash
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="DIGITAL_WALLET" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <Wallet className="mr-2 h-4 w-4" />
                            Digital Wallet
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Add any notes about this transaction" {...field} />
                    </FormControl>
                    <FormDescription>Add any additional information about this sale.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Complete Sale"
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
