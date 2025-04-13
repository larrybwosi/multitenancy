"use client";

import React, {
  useState,
  useTransition,
  useEffect,
} from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Category, Prisma } from "@prisma/client"; // Prisma types are useful
import Image from "next/image";
import {
  Trash2,
  PlusCircle,
  X,
  UploadCloud,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { addProduct, updateProduct } from "@/actions/products";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils"; // For conditional classes
import { Badge } from "@/components/ui/badge"; // For better UI elements
import { uploadSanityAsset } from "@/actions/uploads";

// --- Zod Schemas ---

// Adjusted to include optional ID for editing variants
const AttributeSchema = z.object({
  key: z.string().min(1, "Attribute name cannot be empty"),
  value: z.string().min(1, "Attribute value cannot be empty"),
});

const VariantSchema = z.object({
  id: z.string().cuid().optional(), // For editing existing variants
  name: z.string().optional(), // Still optional, can derive if needed
  sku: z.string().min(1, "Variant SKU is required"),
  barcode: z.string().optional().nullable(),
  priceModifier: z.coerce.number().default(0),
  attributes: z
    .array(AttributeSchema)
    .min(1, "At least one attribute is required per variant"),
  isActive: z.boolean().default(true),
  // Add inventory fields if managed here (adjust defaults)
  reorderPoint: z.coerce.number().int().min(0).default(5),
  reorderQty: z.coerce.number().int().min(0).default(10),
  lowStockAlert: z.boolean().default(false),
});

// Adjusted to include optional ID for editing product and imageUrls
const ProductFormSchema = z.object({
  id: z.string().cuid().optional(), // For editing
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional().nullable(),
  sku: z.string().min(1, "Base SKU is required"),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  basePrice: z.coerce.number().min(0, "Base price must be non-negative"),
  reorderPoint: z.coerce.number().int().min(0).default(5),
  isActive: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).optional().default([]), // Existing image URLs
  variants: z.array(VariantSchema).optional().default([]),
});

type ProductFormData = z.infer<typeof ProductFormSchema>;

// Define a type for the product data passed for editing
// Adjust based on what your fetching logic returns
type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true };
}>;

// --- Component Props ---
interface ProductDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  categories: Category[];
  initialData?: ProductWithVariants | null; // Pass product data for editing
  onSuccess?: (message: string, updatedProduct?: ProductWithVariants) => void; // Can pass back updated data
  onError?: (message: string) => void;
}

// --- Component ---
export default function ProductDialog({
  isOpen,
  setIsOpen,
  categories,
  initialData = null, // Default to null for "Add" mode
  onSuccess,
  onError,
}: ProductDialogProps) {
  const [isProcessing, startTransition] = useTransition(); // More general term than isPending
  const [isUploading, setIsUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [newlySelectedFiles, setNewlySelectedFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  console.log("initialData", initialData);
  const isEditMode = !!initialData;
  const dialogTitle = isEditMode ? "Edit Product" : "Add New Product";
  const dialogDescription = isEditMode
    ? "Update the details, variants, and images for this product."
    : "Fill in the details, variants, and images for the new product.";
  const submitButtonText = isEditMode ? "Save Changes" : "Add Product";

  const form = useForm({
    resolver: zodResolver(ProductFormSchema),
    defaultValues:
      isEditMode && initialData
        ? {
            ...initialData,
            basePrice: initialData.basePrice, // Convert Decimal to number
            variants:
              initialData?.variants?.map((v) => ({
                ...v,
                priceModifier: v.priceModifier.toNumber(), // Convert Decimal
                // Convert Prisma JSON attributes to AttributeSchema array
                attributes:
                  v.attributes &&
                  typeof v.attributes === "object" &&
                  !Array.isArray(v.attributes)
                    ? Object.entries(v?.attributes)?.map(([key, value]) => ({
                        key,
                        value: String(value),
                      }))
                    : [], // Handle potential null/invalid structure
              })) ?? [],
          }
        : {
            // Default values for "Add" mode
            name: "",
            description: "",
            sku: "",
            barcode: "",
            categoryId: "",
            basePrice: 0,
            reorderPoint: 5,
            isActive: true,
            imageUrls: [],
            variants: [],
          },
  });


  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
    update: updateVariant, // Useful for attribute changes
  } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  // --- Image Handling ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      // You could add size validation here too
      setNewlySelectedFiles((prev) => [...prev, ...imageFiles]);

      // Generate previews only for new files
      const newPreviewsToAdd = imageFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setNewImagePreviews((prev) => [...prev, ...newPreviewsToAdd]);
    }
    event.target.value = ""; // Allow selecting same file again
  };

  // Remove a newly selected image (before upload)
  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]); // Cleanup preview URL
    setNewlySelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove an already existing image (mark for removal on submit)
  const removeExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
    // We update the form state directly so it's included in the submission
    form.setValue(
      "imageUrls",
      existingImageUrls.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      newImagePreviews.forEach(URL.revokeObjectURL);
    };
  }, [newImagePreviews]);

  // --- Form Submission ---
const onSubmit = async (data: ProductFormData) => {
  setServerError(null);
  setIsUploading(true);

  // 1. Upload NEW images first
  const uploadedUrls: string[] = [];
  const uploadErrors: string[] = [];

  for (const file of newlySelectedFiles) {
    //@ts-expect-error File type
    const result = await uploadSanityAsset(file, "image", "image");
    if (result) {
      uploadedUrls.push(result);
    } else {
      console.error("Upload failed:", result);
      uploadErrors.push(`Failed to upload ${file.name}: ${result}`);
    }
  }

  setIsUploading(false);

  // If any uploads failed, stop and report
  if (uploadErrors.length > 0) {
    setServerError(`Image upload failed: ${uploadErrors.join("; ")}`);
    onError?.(`Image upload failed: ${uploadErrors.join("; ")}`);
    return;
  }

  // 2. Prepare data for server action
  const finalImageUrls = [...existingImageUrls, ...uploadedUrls];
  const formData = new FormData();

  // Convert RHF data back to FormData compatible format
  Object.entries(data).forEach(([key, value]) => {
    if (key === "variants" || key === "imageUrls") return; // Handled separately

    if (key === "basePrice" || key === "reorderPoint") {
      formData.append(key, String(value));
    } else if (typeof value === "boolean") {
      formData.append(key, String(value));
    } else if (value !== undefined && value !== null) {
      formData.append(key, value as string);
    }
  });

  // Handle optional barcode correctly
  if (data.barcode) {
    formData.append("barcode", data.barcode);
  }

  // Format variants
  const variantsForServer = (data.variants ?? []).map((v) => ({
    ...v,
    id: v.id,
    priceModifier: v.priceModifier,
    attributes: v.attributes.reduce(
      (acc, attr) => {
        if (attr.key) acc[attr.key] = attr.value;
        return acc;
      },
      {} as Record<string, string>
    ),
    reorderPoint: v.reorderPoint,
    reorderQty: v.reorderQty,
    lowStockAlert: v.lowStockAlert,
  }));

  formData.append("variants", JSON.stringify(variantsForServer));

  // Fix: Add each image URL separately instead of stringifying the array
  finalImageUrls.forEach((url) => {
    formData.append("imageUrls", url);
  });

  // Append ID if in edit mode
  if (isEditMode && data.id) {
    formData.append("id", data.id);
  }

  // 3. Call the appropriate server action
  startTransition(async () => {
    try {
      const action = isEditMode ? updateProduct : addProduct;
      const result = await action(formData);

      if (result?.error) {
        setServerError(result.error);
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              const fieldName = field as keyof ProductFormData;
              form.setError(fieldName, {
                type: "server",
                message: errors.join(", "),
              });
            }
          });
        }

        onError?.(result.error);
      } else {
        onSuccess?.(
          isEditMode
            ? `Product "${result.data?.name}" updated successfully!`
            : `Product "${result.data?.name}" added successfully!`,
          result.data
        );
        resetDialogState();
        setIsOpen(false);
      }
    } catch (e) {
      console.error("Submission Error:", e);
      const errorMsg =
        e instanceof Error ? e.message : "An unexpected error occurred.";
      setServerError(errorMsg);
      onError?.(errorMsg);
    }
  });
};

  // --- Helper Functions ---
  const resetDialogState = () => {
    form.reset(
      isEditMode && initialData
        ? {
            // Re-apply initial data defaults if editing
            ...initialData,
            basePrice: initialData.basePrice.toNumber(),
            variants:
              initialData.variants.map((v) => ({
                ...v,
                priceModifier: v.priceModifier.toNumber(),
                attributes:
                  v.attributes &&
                  typeof v.attributes === "object" &&
                  !Array.isArray(v.attributes)
                    ? Object.entries(v.attributes).map(([key, value]) => ({
                        key,
                        value: String(value),
                      }))
                    : [],
              })) ?? [],
          }
        : ProductFormSchema.parse({})
    ); // Reset with empty defaults for add mode
    setServerError(null);
    setNewlySelectedFiles([]);
    setNewImagePreviews([]);
    setExistingImageUrls(isEditMode ? (initialData?.imageUrls ?? []) : []); // Reset existing URLs too
  };

  const handleOpenChange = (open: boolean) => {
    if (!isProcessing && !isUploading) {
      // Prevent closing while processing/uploading
      setIsOpen(open);
      if (!open) {
        resetDialogState(); // Reset fully on close
      }
    }
  };

  // Helper to add attribute to a specific variant
  const addAttribute = (variantIndex: number) => {
    const currentAttributes =
      form.getValues(`variants.${variantIndex}.attributes`) || [];
    form.setValue(
      `variants.${variantIndex}.attributes`,
      [...currentAttributes, { key: "", value: "" }],
      { shouldValidate: true }
    );
  };

  // Helper to remove attribute from a specific variant
  const removeAttribute = (variantIndex: number, attributeIndex: number) => {
    const currentAttributes =
      form.getValues(`variants.${variantIndex}.attributes`) || [];
    form.setValue(
      `variants.${variantIndex}.attributes`,
      currentAttributes.filter((_, i) => i !== attributeIndex),
      { shouldValidate: false }
    ); // No validation needed on remove
  };

  // --- Render ---
  const isLoading = isProcessing || isUploading;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        {" "}
        {/* Wider, max height */}
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        {/* Separate Scroll Area for Form Content */}
        <ScrollArea className="flex-grow p-1 pr-5 -ml-1">
          {" "}
          {/* Fill remaining space */}
          <Form {...form}>
            <form
              id="product-form" // Give form an ID for external submit button linkage
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 pb-6"
            >
              <ScrollArea className="flex-grow overflow-scroll max-h-[calc(100vh-220px)]">
                {serverError && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    <p className="text-sm font-medium text-destructive">
                      {serverError}
                    </p>
                  </div>
                )}
                <div className="flex-row">
                  {/* --- Basic Product Details Section --- */}
                  <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-white">
                    <h3 className="text-lg font-semibold mb-3 border-b pb-2">
                      Basic Information
                    </h3>
                    <FormField /* Name */
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Product Name{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Premium Ergonomic Chair"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField /* SKU */
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Base SKU{" "}
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., CHAIR-ERGO-PREM"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Unique identifier for the base product.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField /* Barcode */
                        control={form.control}
                        name="barcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Barcode (UPC/EAN)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Optional: Scan or enter barcode"
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField /* Category */
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Category <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField /* Base Price */
                        control={form.control}
                        name="basePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Base Selling Price ($){" "}
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="199.99"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField /* Reorder Point */
                        control={form.control}
                        name="reorderPoint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reorder Point</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                min="0"
                                placeholder="5"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Base product&apos;s low stock warning level.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField /* Description */
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Optional: Describe features, materials, etc."
                              className="min-h-[80px]"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField /* Is Active */
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-stone-50 shadow-sm">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Product Active</FormLabel>
                            <FormDescription className="text-xs">
                              Inactive products won&apos;t appear in POS or
                              default lists.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col space-y-4">
                    {/* --- Product Variants Section --- */}
                    <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-white">
                      <div className="flex justify-between items-center mb-3 border-b pb-2">
                        <h3 className="text-lg font-semibold">
                          Product Variants
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            appendVariant(
                              VariantSchema.parse({
                                attributes: [{ key: "", value: "" }],
                              })
                            )
                          }
                          disabled={isLoading}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
                        </Button>
                      </div>
                      {variantFields.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No variants added. Use variants for options like size
                          or color.
                        </p>
                      )}
                      <div className="space-y-4">
                        {variantFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="p-4 border rounded-md space-y-4 relative bg-slate-50/60"
                          >
                            {/* Remove Variant Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => removeVariant(index)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />{" "}
                              <span className="sr-only">Remove Variant</span>
                            </Button>

                            {/* Display Variant ID if editing */}
                            {field.id && (
                              <Badge
                                variant="outline"
                                className="text-xs font-mono absolute top-2 left-2"
                              >
                                ID: {field.id.substring(0, 8)}...
                              </Badge>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                              {" "}
                              {/* Add padding top if showing ID */}
                              <FormField /* Variant SKU */
                                control={form.control}
                                name={`variants.${index}.sku`}
                                render={({ field: variantField }) => (
                                  <FormItem>
                                    <FormLabel>
                                      Var. SKU{" "}
                                      <span className="text-destructive">
                                        *
                                      </span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., CHAIR-ERGO-BLK"
                                        {...variantField}
                                        className="h-9"
                                      />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                              <FormField /* Variant Price Modifier */
                                control={form.control}
                                name={`variants.${index}.priceModifier`}
                                render={({ field: variantField }) => (
                                  <FormItem>
                                    <FormLabel>Price Mod. ($)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="+10.00"
                                        {...variantField}
                                        className="h-9"
                                      />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                              <FormField /* Variant Barcode */
                                control={form.control}
                                name={`variants.${index}.barcode`}
                                render={({ field: variantField }) => (
                                  <FormItem>
                                    <FormLabel>Var. Barcode</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Optional barcode"
                                        {...variantField}
                                        value={variantField.value ?? ""}
                                        className="h-9"
                                      />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* --- Variant Attributes Section --- */}
                            <div className="space-y-2 pt-2">
                              <div className="flex justify-between items-center">
                                <FormLabel className="text-sm font-medium text-gray-700">
                                  Attributes{" "}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <Button
                                  type="button"
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs"
                                  onClick={() => addAttribute(index)}
                                  disabled={isLoading}
                                >
                                  <PlusCircle className="mr-1 h-3 w-3" /> Add
                                </Button>
                              </div>
                              {form
                                .watch(`variants.${index}.attributes`)
                                ?.map((_, attrIndex) => (
                                  <div
                                    key={`${field.id}-attr-${attrIndex}`}
                                    className="flex items-start gap-2"
                                  >
                                    <FormField
                                      control={form.control}
                                      name={`variants.${index}.attributes.${attrIndex}.key`}
                                      render={({ field: attrField }) => (
                                        <FormItem className="flex-1">
                                          <FormControl>
                                            <Input
                                              placeholder="e.g., Color"
                                              {...attrField}
                                              className="h-8 text-sm"
                                            />
                                          </FormControl>
                                          <FormMessage className="text-xs" />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`variants.${index}.attributes.${attrIndex}.value`}
                                      render={({ field: attrField }) => (
                                        <FormItem className="flex-1">
                                          <FormControl>
                                            <Input
                                              placeholder="e.g., Black"
                                              {...attrField}
                                              className="h-8 text-sm"
                                            />
                                          </FormControl>
                                          <FormMessage className="text-xs" />
                                        </FormItem>
                                      )}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 mt-0"
                                      onClick={() =>
                                        removeAttribute(index, attrIndex)
                                      }
                                      disabled={isLoading}
                                    >
                                      <X className="h-4 w-4" />{" "}
                                      <span className="sr-only">
                                        Remove Attribute
                                      </span>
                                    </Button>
                                  </div>
                                ))}
                              {/* Display validation message for the attributes array itself */}
                              {form.formState.errors.variants?.[index]
                                ?.attributes?.message && (
                                <p className="text-xs font-medium text-destructive">
                                  {
                                    form.formState.errors.variants?.[index]
                                      ?.attributes?.message
                                  }
                                </p>
                              )}
                            </div>
                            <Separator className="my-3" />
                            {/* Optional: Add Variant Specific Inventory Fields if needed */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                              <FormField
                                control={form.control}
                                name={`variants.${index}.reorderPoint`}
                                render={({ field: vf }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">
                                      Var. Reorder Pt.
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="1"
                                        min="0"
                                        placeholder="5"
                                        {...vf}
                                        className="h-8 text-sm"
                                      />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variants.${index}.reorderQty`}
                                render={({ field: vf }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">
                                      Var. Reorder Qty
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="1"
                                        min="0"
                                        placeholder="10"
                                        {...vf}
                                        className="h-8 text-sm"
                                      />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                              <FormField /* Variant Active */
                                control={form.control}
                                name={`variants.${index}.isActive`}
                                render={({ field: vf }) => (
                                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-5">
                                    <FormControl>
                                      <Checkbox
                                        checked={vf.value}
                                        onCheckedChange={vf.onChange}
                                        id={`var-active-${index}`}
                                      />
                                    </FormControl>
                                    <FormLabel
                                      htmlFor={`var-active-${index}`}
                                      className="text-xs font-normal"
                                    >
                                      Active
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                              <FormField /* Variant Low Stock Alert */
                                control={form.control}
                                name={`variants.${index}.lowStockAlert`}
                                render={({ field: vf }) => (
                                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-5">
                                    <FormControl>
                                      <Checkbox
                                        checked={vf.value}
                                        onCheckedChange={vf.onChange}
                                        id={`var-lowstock-${index}`}
                                      />
                                    </FormControl>
                                    <FormLabel
                                      htmlFor={`var-lowstock-${index}`}
                                      className="text-xs font-normal"
                                    >
                                      Low Stock Alert
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                        {/* Display root error for variants array */}
                        {form.formState.errors.variants?.root?.message && (
                          <p className="text-sm font-medium text-destructive">
                            {form.formState.errors.variants?.root?.message}
                          </p>
                        )}
                        {form.formState.errors.variants?.message &&
                          !form.formState.errors.variants?.root?.message && (
                            <p className="text-sm font-medium text-destructive">
                              {form.formState.errors.variants?.message}
                            </p>
                          )}
                      </div>
                    </div>

                    {/* --- Image Upload Section --- */}
                    <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-white">
                      <h3 className="text-lg font-semibold mb-3 border-b pb-2">
                        Product Images
                      </h3>
                      {/* Combined Previews */}
                      {(existingImageUrls.length > 0 ||
                        newImagePreviews.length > 0) && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 mb-4">
                          {/* Existing Images */}
                          {existingImageUrls.map((url, index) => (
                            <div
                              key={`existing-${index}`}
                              className="relative aspect-square border rounded-md overflow-hidden group shadow-sm"
                            >
                              <Image
                                src={url}
                                alt={`Existing Image ${index + 1}`}
                                fill
                                sizes="(max-width: 640px) 33vw, 20vw"
                                className="object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-60 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeExistingImage(index)}
                                disabled={isLoading}
                              >
                                <Trash2 className="h-3 w-3" />{" "}
                                <span className="sr-only">
                                  Remove existing image {index + 1}
                                </span>
                              </Button>
                            </div>
                          ))}
                          {/* New Image Previews */}
                          {newImagePreviews.map((previewUrl, index) => (
                            <div
                              key={`new-${index}`}
                              className="relative aspect-square border border-blue-300 border-dashed rounded-md overflow-hidden group shadow-sm"
                            >
                              <Image
                                src={previewUrl}
                                alt={`New Preview ${index + 1}`}
                                fill
                                sizes="(max-width: 640px) 33vw, 20vw"
                                className="object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-60 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeNewImage(index)}
                                disabled={isLoading}
                              >
                                <Trash2 className="h-3 w-3" />{" "}
                                <span className="sr-only">
                                  Remove new image {index + 1}
                                </span>
                              </Button>
                              {/* Optional: Show upload progress indicator here */}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* File Input - Nicer Styling */}
                      <FormItem className="w-full">
                        <FormLabel
                          htmlFor="file-upload"
                          className={cn(
                            "cursor-pointer block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors",
                            isLoading && "cursor-not-allowed opacity-60"
                          )}
                        >
                          <UploadCloud className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                          <span className="font-medium text-primary">
                            Click to upload
                          </span>{" "}
                          or drag and drop
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG, WEBP recommended (Max 5MB)
                          </p>
                          <FormControl>
                            <Input
                              id="file-upload"
                              type="file"
                              multiple
                              accept="image/png, image/jpeg, image/webp, image/gif"
                              className="sr-only" // Hide default input
                              onChange={handleFileChange}
                              disabled={isLoading}
                            />
                          </FormControl>
                        </FormLabel>
                        <FormMessage />{" "}
                        {/* For potential file-related errors */}
                      </FormItem>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </form>
          </Form>
        </ScrollArea>
        {/* Footer outside ScrollArea */}
        <DialogFooter className="pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading
              ? "Uploading..."
              : isProcessing
                ? isEditMode
                  ? "Saving..."
                  : "Adding..."
                : submitButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
