// app/stocks/components/restock-dialog.tsx
"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Product, ProductVariant } from "@prisma/client";
import { addStockBatch } from "@/actions/stockActions"; // Import server action
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // If using variants
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Zod schema matching the server action's RestockSchema (client-side)
const RestockFormSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional().nullable(), // Optional variant ID
  batchNumber: z.string().optional().nullable(),
  initialQuantity: z.coerce
    .number()
    .int()
    .positive("Quantity must be positive"),
  purchasePrice: z.coerce
    .number()
    .min(0, "Purchase price must be non-negative"),
  expiryDate: z.date().optional().nullable(),
  location: z.string().optional().nullable(),
  // purchaseItemId: z.string().cuid().optional().nullable(), // Add if linking to purchases
});

type RestockFormData = z.infer<typeof RestockFormSchema>;

interface RestockDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: ProductWithRelations | null; // Product being restocked
  // Pass variants if product has them: variants?: ProductVariant[];
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onClose?: () => void; // Callback when dialog closes
}

export default function RestockDialog({
  isOpen,
  setIsOpen,
  product,
  // variants = [],
  onSuccess,
  onError,
  onClose,
}: RestockDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  // const hasVariants = variants && variants.length > 0; // Check if variants exist

  const form = useForm<RestockFormData>({
    resolver: zodResolver(RestockFormSchema),
    // Default values set in useEffect/onOpenChange
  });

  // Effect to reset form when dialog opens or product changes
  useEffect(() => {
    if (isOpen && product) {
      form.reset({
        productId: product.id,
        variantId: null, // Default to null, user selects if variants exist
        batchNumber: "",
        initialQuantity: 1, // Sensible default
        purchasePrice: 0,
        expiryDate: null,
        location: "",
        // purchaseItemId: null,
      });
      setServerError(null); // Clear errors when resetting
    }
  }, [isOpen, product, form]); // form added to dependencies

  const onSubmit = (data: RestockFormData) => {
    if (!product) return;

    setServerError(null);
    const formData = new FormData();

    // Append data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Format date correctly for FormData
        if (key === "expiryDate" && value instanceof Date) {
          formData.append(key, value.toISOString()); // Send as ISO string
        } else {
          formData.append(key, String(value));
        }
      }
    });
    // Ensure optional fields are handled correctly
    if (!data.variantId) formData.delete("variantId"); // Don't send null/empty variantId
    if (!data.batchNumber) formData.delete("batchNumber");
    if (!data.location) formData.delete("location");
    if (!data.expiryDate) formData.delete("expiryDate");

    startTransition(async () => {
      const result = await addStockBatch(formData); // Call the server action

      if (result?.error) {
        setServerError(result.error);
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof RestockFormData, {
                type: "server",
                message: errors.join(", "),
              });
            }
          });
        }
        onError?.(result.error);
      } else {
        onSuccess?.(
          `Stock added successfully for "${product?.name}"! Batch ID: ${result.batch?.id}`
        );
        setIsOpen(false); // Close dialog on success
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!isPending) {
      // Prevent closing while submitting
      setIsOpen(open);
      if (!open) {
        form.reset(); // Reset form when closing manually
        setServerError(null);
        onClose?.(); // Call the onClose callback
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Stock / Restock: {product?.name}</DialogTitle>
          <DialogDescription>
            Enter details for the incoming stock batch.
          </DialogDescription>
        </DialogHeader>
        {product ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2"
            >
              {serverError && (
                <p className="text-sm font-medium text-destructive">
                  {serverError}
                </p>
              )}

              {/* Hidden Product ID */}
              <input type="hidden" {...form.register("productId")} />

              {/* Optional: Variant Selection */}
              {/* {hasVariants && (
                         <FormField
                            control={form.control}
                            name="variantId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Product Variant</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value ?? undefined}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select variant (if applicable)" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {variants.map((variant) => (
                                        <SelectItem key={variant.id} value={variant.id}>
                                        {variant.name} ({variant.sku})
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    )} */}

              <FormField
                control={form.control}
                name="initialQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quantity Received{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g., 50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Unit Purchase Cost ($){" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g., 5.50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiry Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            disabled={(
                              date // Optionally disable past dates
                            ) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="batchNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., LOT12345"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Identifier for this specific batch.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Location (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Shelf A-3"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Optional: Link to Purchase Order Item */}
              {/* <FormField name="purchaseItemId" ... /> */}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isPending ? "Adding Stock..." : "Add Stock Batch"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
