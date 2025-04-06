// app/stocks/components/edit-product-dialog.tsx
"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Category } from "@prisma/client";
import { updateProduct } from "@/actions/stockActions"; // Import server action
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ProductWithRelations } from "./products-columns";

// Zod schema matching the server action's EditProductSchema
const EditProductFormSchema = z.object({
  id: z.string().cuid(), // ID is required for update
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  basePrice: z.coerce.number().min(0, "Base price must be non-negative"),
  reorderPoint: z.coerce
    .number()
    .int()
    .min(0, "Reorder point must be non-negative"),
  isActive: z.boolean().default(true),
  // imageUrls: z.array(z.string().url()).optional(), // Add later if needed
});

type EditProductFormData = z.infer<typeof EditProductFormSchema>;

interface EditProductDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: ProductWithRelations | null; // Product to edit
  categories: Category[];
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onClose?: () => void; // Callback when dialog closes
}

export default function EditProductDialog({
  isOpen,
  setIsOpen,
  product,
  categories,
  onSuccess,
  onError,
  onClose,
}: EditProductDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<EditProductFormData>({
    resolver: zodResolver(EditProductFormSchema),
    // Default values will be set by reset in useEffect/onOpenChange
  });

  // Effect to reset form when dialog opens or product changes
  useEffect(() => {
    if (isOpen && product) {
      form.reset({
        id: product.id,
        name: product.name,
        description: product.description ?? "",
        sku: product.sku,
        barcode: product.barcode ?? "",
        categoryId: product.categoryId ?? "",
        // Ensure basePrice is a number for the form field
        basePrice:
          typeof product.basePrice === "object"
            ? parseFloat(product.basePrice.toString()) // Handle Prisma Decimal
            : product.basePrice,
        reorderPoint: product.reorderPoint,
        isActive: product.isActive,
        // imageUrls: product.imageUrls ?? [],
      });
      setServerError(null); // Clear errors when resetting
    }
  }, [isOpen, product, form]); // form added to dependencies

  const onSubmit = (data: EditProductFormData) => {
    if (!product) return; // Should not happen if dialog is open

    setServerError(null);
    const formData = new FormData();

    // Append data including the ID
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === "boolean") {
          formData.append(key, value ? "true" : "false");
        } else {
          formData.append(key, String(value));
        }
      }
    });
    // Handle potentially null barcode explicitly
    if (data.barcode === null || data.barcode === "") {
      formData.append("barcode", ""); // Send empty string to potentially clear it on backend
    } else {
      formData.append("barcode", data.barcode);
    }

    startTransition(async () => {
      const result = await updateProduct(formData); // Call the update server action

      if (result?.error) {
        setServerError(result.error);
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof EditProductFormData, {
                type: "server",
                message: errors.join(", "),
              });
            }
          });
        }
        onError?.(result.error);
      } else {
        onSuccess?.(`Product "${result.product?.name}" updated successfully!`);
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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Product: {product?.name}</DialogTitle>
          <DialogDescription>
            Update the product details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        {product ? ( // Render form only when product data is available
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

              {/* Hidden ID field */}
              <input type="hidden" {...form.register("id")} />

              {/* Re-use form fields from AddProductDialog, adapting as needed */}
              <FormField
                control={form.control}
                name="name"
                render={({ field } /* ... same as add dialog ... */) => (
                  <FormItem>
                    <FormLabel>
                      Product Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field } /* ... same as add dialog ... */) => (
                  <FormItem>
                    <FormLabel>
                      SKU <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Unique identifier.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field } /* ... same as add dialog ... */) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field } /* ... */) => (
                    <FormItem>
                      <FormLabel>
                        Selling Price ($){" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reorderPoint"
                  render={({ field } /* ... */) => (
                    <FormItem>
                      <FormLabel>Reorder Point</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" min="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        Low stock warning level.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field } /* ... */) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field } /* ... */) => (
                  <FormItem>
                    <FormLabel>Barcode (UPC/EAN)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field } /* ... same as add dialog ... */) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Product Active</FormLabel>
                      <FormDescription>
                        Inactive products won't appear in sales or default
                        lists.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

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
                  {isPending ? "Saving..." : "Save Changes"}
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
