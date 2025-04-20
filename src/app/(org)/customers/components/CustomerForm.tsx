"use client";
import React, { useState, useTransition, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  UserPlus,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Tag,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Customer } from "@prisma/client";
import { saveCustomer } from "@/actions/customers.actions";
import { ScrollArea } from "@/components/ui/scroll-area";

// Form Schema
const CustomerFormSchema = z.object({
  name: z.string().min(1, "Customer name is required."),
  email: z
    .string()
    .email("Invalid email address.")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Type inference for form values
type CustomerFormValues = z.infer<typeof CustomerFormSchema>;

// Default values for the form
const defaultValues: Partial<CustomerFormValues> = {
  name: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  isActive: true,
};

interface CustomerFormProps {
  customer?: Customer | null; // For editing
  onFormSubmit?: () => void; // Callback to close dialog/modal
}

export function CreateCustomerSheet({
  customer,
  onFormSubmit,
}: CustomerFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!customer;

  const form = useForm({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues,
  });

  // Reset form when opening/closing or when customer changes
  useEffect(() => {
    if (open) {
      if (customer) {
        form.reset({
          name: customer.name,
          email: customer.email || "",
          phone: customer.phone || "",
          address: customer.address || "",
          notes: customer.notes || "",
          isActive: customer.isActive,
        });
      } else {
        form.reset(defaultValues);
      }
    }
  }, [open, customer, form]);

  async function onSubmit(data: CustomerFormValues) {
    setError(null);
    const formData = new FormData();

    if (isEditing && customer?.id) {
      formData.append("id", customer.id);
    }

    formData.append("name", data.name);
    formData.append("isActive", String(data.isActive));
    if (data.email) formData.append("email", data.email);
    if (data.phone) formData.append("phone", data.phone);
    if (data.address) formData.append("address", data.address);
    if (data.notes) formData.append("notes", data.notes);

    startTransition(async () => {
      try {
        const result = await saveCustomer(formData);

        if (result?.errors) {
          setError("Validation failed on server.");
          toast.error("Failed to save customer. Check fields.");
        } else if (result?.message) {
          setError(result.message);
          toast.error("Failed to save customer", {
            description: result.message,
            duration: 5000,
          });
        } else {
          toast.success(isEditing ? "Customer updated!" : "Customer created!");
          form.reset();
          setOpen(false);
          onFormSubmit?.();
        }
      } catch (err) {
        setError("An unexpected error occurred");
        toast.error("Failed to save customer", {
          description: "Please try again later",
          duration: 5000,
        });
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 px-4 py-2">
          <UserPlus className="h-4 w-4" />
          <span>{isEditing ? "Edit Customer" : "New Customer"}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl w-full border-l border-slate-200 bg-white overflow-y-auto">
        <ScrollArea>
          <SheetHeader className="mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg shadow-md">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-bold text-slate-800">
                  {isEditing ? "Edit Customer" : "Add New Customer"}
                </SheetTitle>
                <SheetDescription className="text-slate-500 mt-1">
                  {isEditing
                    ? "Update the customer details below."
                    : "Create a new customer record in your system with the details below."}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Name Field */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-0.5 rounded-xl shadow-sm">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="bg-white rounded-lg p-4">
                        <FormLabel className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span>Full Name</span>
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            {...field}
                            disabled={isPending}
                            className="border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-10"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email and Phone Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-0.5 rounded-xl shadow-sm">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="bg-white rounded-lg p-4 h-full">
                          <FormLabel className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-600" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john@example.com"
                              {...field}
                              disabled={isPending}
                              className="border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-10"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-slate-500 mt-1">
                            Customer contact email address
                          </FormDescription>
                          <FormMessage className="text-red-500 text-xs mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-0.5 rounded-xl shadow-sm">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="bg-white rounded-lg p-4 h-full">
                          <FormLabel className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-blue-600" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+1 (555) 123-4567"
                              {...field}
                              disabled={isPending}
                              className="border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-10"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Address Field */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-0.5 rounded-xl shadow-sm">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="bg-white rounded-lg p-4">
                        <FormLabel className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          Physical Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Main St, City, State, ZIP"
                            {...field}
                            disabled={isPending}
                            className="border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-10"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes Field */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-0.5 rounded-xl shadow-sm">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="bg-white rounded-lg p-4">
                        <FormLabel className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          Additional Notes
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Customer preferences, special requirements, or other relevant information..."
                            className="resize-none min-h-[120px] border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Active Status */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-0.5 rounded-xl shadow-sm">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="bg-white rounded-lg p-4 flex flex-row items-center justify-between">
                        <div className="space-y-1">
                          <FormLabel className="text-slate-700 flex items-center gap-2">
                            <Tag className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Customer Status</span>
                          </FormLabel>
                          <FormDescription className="text-xs text-slate-500">
                            Toggle to activate or deactivate this customer
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending}
                            className={cn(
                              "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-indigo-600",
                              "data-[state=unchecked]:bg-slate-300"
                            )}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <SheetFooter className="pt-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors h-10 px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 h-10 px-6"
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Update Customer" : "Create Customer"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
