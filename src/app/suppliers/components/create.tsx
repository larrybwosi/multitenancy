"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useTransition } from "react";
import { toast } from "sonner"; // Or your preferred toast library

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
import { Loader2 } from "lucide-react";

import {
  createSupplier,
  updateSupplier,
  SupplierFormData,
} from "@/actions/supplier.actions";
import type { Supplier } from "@prisma/client";

// Re-use the schema shape from actions (or define it here)
const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Supplier name must be at least 2 characters." }),
  contactName: z.string().optional(),
  email: z
    .string()
    .email({ message: "Invalid email address." })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  leadTime: z.coerce.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

interface SupplierFormProps {
  mode: "create" | "edit";
  supplier?: Supplier | null; // Supplier data for edit mode
  onSuccess?: () => void; // Optional callback on success (e.g., close sheet)
}

export function SupplierForm({ mode, supplier, onSuccess }: SupplierFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(formSchema),
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

  function onSubmit(values: SupplierFormData) {
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Name (Required) */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Global Tech Supplies" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Name */}
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Jane Doe"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="e.g., contact@supplier.com"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., +1 234 567 890"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
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
                <FormLabel>Lead Time (Days)</FormLabel>
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
                  />
                </FormControl>
                <FormDescription>
                  Estimated days from order to delivery.
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
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., 123 Supply St, Tech City, TX 75001"
                  className="min-h-[80px]"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Terms */}
        <FormField
          control={form.control}
          name="paymentTerms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Terms</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Net 30 Days"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>Agreed payment conditions.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is Active */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-background">
              <div className="space-y-0.5">
                <FormLabel>Active Supplier</FormLabel>
                <FormDescription>
                  Inactive suppliers won't appear in selection lists.
                </FormDescription>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Is Active"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "create" ? "Creating..." : "Saving..."}
            </>
          ) : mode === "create" ? (
            "Create Supplier"
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </Form>
  );
}
