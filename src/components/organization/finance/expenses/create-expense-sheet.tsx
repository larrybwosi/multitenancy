"use client"

import { FormDescription } from "@/components/ui/form"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CheckIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Switch } from "@/components/ui/switch"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"

const formSchema = z.object({
  description: z.string().min(3, {
    message: "Description must be at least 3 characters.",
  }),
  amount: z.coerce.number().positive({
    message: "Amount must be a positive number.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  date: z.date(),
  paymentMethod: z.string().min(1, {
    message: "Please select a payment method.",
  }),
  vendor: z.string().min(1, {
    message: "Please enter a vendor name.",
  }),
  department: z.string().min(1, {
    message: "Please select a department.",
  }),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string().optional(),
  recurringEndDate: z.date().optional().nullable(),
  taxDeductible: z.boolean().default(false),
  taxCategory: z.string().optional(),
  project: z.string().optional(),
  costCenter: z.string().optional(),
})

interface CreateExpenseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: string[]
  departments: string[]
  vendors: string[]
  onExpenseCreated: () => void
}

export function CreateExpenseSheet({
  open,
  onOpenChange,
  categories,
  departments,
  vendors,
  onExpenseCreated,
}: CreateExpenseSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: undefined,
      category: "",
      date: new Date(),
      paymentMethod: "",
      vendor: "",
      department: "",
      notes: "",
      isRecurring: false,
      recurringFrequency: "Monthly",
      recurringEndDate: null,
      taxDeductible: false,
      taxCategory: "",
      project: "",
      costCenter: "",
    },
  })

  const watchIsRecurring = form.watch("isRecurring")
  const watchTaxDeductible = form.watch("taxDeductible")

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/organization/finance/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to create expense")
      }

      const data = await response.json()
      toast.success("Expense created",{
        description: "Your expense has been created successfully.",
      })
      form.reset()
      onExpenseCreated()
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating expense:", error)
      toast.error("Error",{
        description: "Failed to create expense. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add Expense</SheetTitle>
          <SheetDescription>Create a new expense record. Fill in the details below.</SheetDescription>
        </SheetHeader>
        <div className="flex border-b mb-4">
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium",
              activeTab === "basic" ? "border-b-2 border-primary" : "text-muted-foreground",
            )}
            onClick={() => setActiveTab("basic")}
          >
            Basic Info
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium",
              activeTab === "advanced" ? "border-b-2 border-primary" : "text-muted-foreground",
            )}
            onClick={() => setActiveTab("advanced")}
          >
            Advanced
          </button>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            {activeTab === "basic" && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter expense description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input type="number" step="0.01" placeholder="0.00" className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <DatePicker date={field.value} setDate={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
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
                  name="vendor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor/Payee</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a vendor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor} value={vendor}>
                              {vendor}
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
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Check">Check</SelectItem>
                          <SelectItem value="Mobile Payment">Mobile Payment</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {activeTab === "advanced" && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem key={department} value={department}>
                              {department}
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
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Recurring Expense</FormLabel>
                        <FormDescription>Set this expense to repeat automatically</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watchIsRecurring && (
                  <>
                    <FormField
                      control={form.control}
                      name="recurringFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Daily">Daily</SelectItem>
                              <SelectItem value="Weekly">Weekly</SelectItem>
                              <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="Quarterly">Quarterly</SelectItem>
                              <SelectItem value="Yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recurringEndDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date (Optional)</FormLabel>
                          <FormControl>
                            <DatePicker date={field.value || undefined} setDate={field.onChange} label="No end date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="taxDeductible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Tax Deductible</FormLabel>
                        <FormDescription>Mark this expense as tax deductible</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watchTaxDeductible && (
                  <FormField
                    control={form.control}
                    name="taxCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tax category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Business Expense">Business Expense</SelectItem>
                            <SelectItem value="Capital Expense">Capital Expense</SelectItem>
                            <SelectItem value="Travel Expense">Travel Expense</SelectItem>
                            <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                            <SelectItem value="Professional Services">Professional Services</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes or details"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <SheetFooter className="flex space-x-2 pt-4">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  <XIcon className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="mr-2 h-4 w-4" />
                    Save Expense
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
