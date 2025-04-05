"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  productSchema,
  ProductFormData,
} from "@/lib/validations/product";
import { ProductColumn } from "./columns"; // Use the column type for initial data if needed
import { Product, ProductType } from "@prisma/client"; // Import Prisma types
import { createProduct, updateProduct } from "@/actions/products"; // Import server actions
import { toast } from "sonner"; // For user feedback
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth/authClient";

interface ProductFormProps {
  initialData?: ProductColumn | Product | null; // Product data for editing
  onSuccess: () => void; // Callback after successful save
  categories?: { id: string; name: string }[]; // Pass categories for dropdown
}

export function ProductForm({
  initialData,
  onSuccess,
  categories = [],
}: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData;
  const { data: session } = useSession()
  
  const userId = session?.user.id
  const organizationId = session?.session.activeOrganizationId
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      sku: initialData?.sku ?? "",
      type: initialData?.type ?? ProductType.PHYSICAL,
      unit: initialData?.unit ?? "",
      currentSellingPrice: initialData?.currentSellingPrice?.toNumber() ?? 0,
      categoryId: initialData?.categoryId ?? null,
      isActive: initialData?.isActive ?? true,
    },
  });

  function onSubmit(values: ProductFormData) {
    
  if (!userId || !organizationId) return;

    startTransition(async () => {
      try {
        let response;
        if (isEditing && initialData?.id) {
          console.log(
            "Updating product:",
            initialData.id,
            "with values:",
            values
          );
          response = await updateProduct({
            ...values,
            productId: initialData.id,
            organizationId,
            userId,
          });
        } else {
          console.log("Creating product with values:", values);
          response = await createProduct({
            ...values,
          });
        }

        console.log("Server action response:", response);

        if (response.success) {
          toast.success(
            `Product ${isEditing ? "updated" : "created"} successfully!`
          );
          form.reset(); // Reset form after successful submission
          onSuccess(); // Close modal/sheet and refresh data
        } else {
          toast.error(`Error: ${response.error || "Failed to save product."}`);
          // Handle validation errors if your action returns them
          if (response.validationErrors) {
            Object.entries(response.validationErrors).forEach(
              ([field, message]) => {
                form.setError(field as keyof ProductFormData, {
                  type: "manual",
                  message,
                });
              }
            );
          }
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("An unexpected error occurred.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Premium Coffee Beans" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* SKU */}
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., COF-PREM-500G"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>Optional unique identifier.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the product..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Unit */}
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., pcs, kg, litre, hour" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Selling Price */}
          <FormField
            control={form.control}
            name="currentSellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price *</FormLabel>
                <FormControl>
                  {/* Use type="number" with step for better mobile experience */}
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ProductType.PHYSICAL}>
                      Physical (Tracks Stock)
                    </SelectItem>
                    <SelectItem value={ProductType.SERVICE}>
                      Service (No Stock)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? null : value)
                  }
                  defaultValue={field.value ?? "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Optional product grouping.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Is Active */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Inactive products won't appear in listings or sales unless
                  explicitly searched for.
                </FormDescription>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...
            </>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Create Product"
          )}
        </Button>
      </form>
    </Form>
  );
}
