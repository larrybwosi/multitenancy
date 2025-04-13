"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Plus,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { Supplier } from "@prisma/client";
import { createSupplier, updateSupplier } from "@/actions/supplier";
import { CreateSupplierPayload, CreateSupplierPayloadSchema } from "@/lib/validations/suppliers";

interface SupplierFormProps {
  mode: "create" | "edit";
  supplier?: Supplier | null; // Supplier data for edit mode
  onSuccess?: () => void; // Optional callback on success (e.g., close sheet)
}

export function SupplierForm({ mode, supplier, onSuccess }: SupplierFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(CreateSupplierPayloadSchema),
    defaultValues:
      mode === "edit" && supplier
        ? {
            name: supplier.name,
            contactName: supplier.contactName ?? "",
            email: supplier.email ?? "",
            phone: supplier.phone ?? "",
            address: supplier.address ?? "",
            paymentTerms: supplier.paymentTerms ?? "",
            leadTime: supplier.leadTime ?? null, // Important: handle null correctly
            isActive: supplier.isActive,
          }
        : {
            name: "",
            contactName: "",
            email: "",
            phone: "",
            address: "",
            paymentTerms: "",
            leadTime: null,
            isActive: true,
          },
  });

  function onSubmit(values: CreateSupplierPayload) {
    setError(null); // Clear previous errors
    startTransition(async () => {
      try {
        let result;
        if (mode === "create") {
          result = await createSupplier(values);
        } else if (supplier?.id) {
          result = await updateSupplier(supplier.id, values);
        } else {
          throw new Error("Missing supplier ID for edit mode."); // Should not happen
        }

        if (result.success) {
          toast.success(
            result.message ||
              `Supplier ${mode === "create" ? "created" : "updated"} successfully!`
          );
          form.reset(); // Reset form after successful submission
          if (onSuccess) onSuccess(); // Call the success callback
        } else {
          setError(result.message || `Failed to ${mode} supplier.`);
          // Optional: Set form errors based on result.errors if available
          // if (result.errors) { ... }
          toast.error(result.message || `Failed to ${mode} supplier.`);
        }
      } catch (err) {
        console.error("Form submission error:", err);
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <div className="bg-destructive/15 border border-destructive/30 text-destructive p-4 rounded-lg flex items-center gap-3 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="bg-blue-50/50 pb-4">
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Enter the basic information about the supplier
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Name (Required) */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="mb-6">
                  <FormLabel className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    Supplier Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Global Tech Supplies"
                      {...field}
                      className="focus-visible:ring-blue-500"
                    />
                  </FormControl>
                  <FormDescription>
                    The official registered business name of your supplier
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Name */}
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-blue-600" />
                      Contact Person
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Jane Doe"
                        {...field}
                        value={field.value ?? ""}
                        className="focus-visible:ring-blue-500"
                      />
                    </FormControl>
                    <FormDescription>
                      Your primary point of contact at this supplier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-blue-600" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="e.g., contact@supplier.com"
                        {...field}
                        value={field.value ?? ""}
                        className="focus-visible:ring-blue-500"
                      />
                    </FormControl>
                    <FormDescription>
                      Business email for purchase orders and inquiries
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 shadow-sm">
          <CardHeader className="bg-purple-50/50 pb-4">
            <CardTitle className="text-purple-800 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Details
            </CardTitle>
            <CardDescription>
              How to reach and locate this supplier
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-purple-600" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., +1 234 567 890"
                        {...field}
                        value={field.value ?? ""}
                        className="focus-visible:ring-purple-500"
                      />
                    </FormControl>
                    <FormDescription>
                      Business phone for urgent communications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lead Time (Days) */}
              <FormField
                control={form.control}
                name="leadTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-purple-600" />
                      Lead Time (Days)
                    </FormLabel>
                    <FormControl>
                      {/* Use type="number", but manage value carefully */}
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g., 7"
                        {...field}
                        value={field.value ?? ""} // Handle null/undefined for input value
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value, 10)
                          )
                        } // Parse to int or null
                        className="focus-visible:ring-purple-500"
                      />
                    </FormControl>
                    <FormDescription>
                      Average days from order placement to delivery
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    Business Address
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 123 Supply St, Tech City, TX 75001"
                      className="min-h-[100px] focus-visible:ring-purple-500"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Physical location for shipping and legal documents
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-green-100 shadow-sm">
          <CardHeader className="bg-green-50/50 pb-4">
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment & Status
            </CardTitle>
            <CardDescription>
              Financial terms and supplier status
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Payment Terms */}
            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem className="mb-6">
                  <FormLabel className="flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    Payment Terms
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Net 30 Days"
                      {...field}
                      value={field.value ?? ""}
                      className="focus-visible:ring-green-500"
                    />
                  </FormControl>
                  <FormDescription>
                    Agreed payment timeline and conditions (e.g., Net 30 Days,
                    Cash on Delivery)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Active */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-4 space-y-0 rounded-lg border p-4 shadow-sm bg-background/50 border-green-200 hover:bg-green-50/50 transition-colors">
                  <div className="space-y-1 flex-1">
                    <FormLabel className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`h-4 w-4 ${field.value ? "text-green-600" : "text-gray-400"}`}
                      />
                      Active Supplier Status
                    </FormLabel>
                    <FormDescription>
                      Active suppliers appear in selection lists and can receive
                      new purchase orders. Inactive suppliers are hidden from
                      selection menus.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Is Active"
                      className={`${field.value ? "bg-green-600 border-green-600" : ""} h-5 w-5`}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isPending}
            className={`${mode === "create" ? "bg-blue-600" : "bg-green-600"} hover:bg-opacity-90 px-6 flex items-center gap-2`}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating..." : "Saving..."}
              </>
            ) : mode === "create" ? (
              <>
                <Plus className="h-4 w-4" />
                Create Supplier
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
