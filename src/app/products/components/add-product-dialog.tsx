"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Category } from "@prisma/client"; // Assuming Product type is not needed directly here now
import { addProduct } from "@/actions/stockActions"; // Ensure this action is updated

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
import { Trash2, PlusCircle, X, UploadCloud } from "lucide-react";
import Image from "next/image";

// --- Zod Schemas ---

// Schema for a single variant attribute (key-value pair)
const AttributeSchema = z.object({
  key: z.string().min(1, "Attribute name is required"),
  value: z.string().min(1, "Attribute value is required"),
});

// Schema for a single product variant
const VariantSchema = z.object({
  // id: z.string().optional(), // For potential future editing
  name: z.string().optional(), // Optional: Can be auto-generated from attributes 
  sku: z.string().min(1, "Variant SKU is required"),
  barcode: z.string().optional().nullable(),
  priceModifier: z.coerce.number().default(0),
  attributes: z
    .array(AttributeSchema)
    .min(
      1,
      "At least one attribute (e.g., Color, Size) is required per variant"
    ),
  isActive: z.boolean().default(true),
});

// Main Product Form Schema (excluding images, variants handled separately)
const ProductFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().min(1, "Base SKU is required"),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  basePrice: z.coerce.number().min(0, "Base price must be non-negative"),
  reorderPoint: z.coerce
    .number()
    .int()
    .min(0, "Reorder point must be non-negative")
    .default(5),
  isActive: z.boolean().default(true),
  // Variants will be managed by useFieldArray
  variants: z.array(VariantSchema).optional(), // Optional: Product might not have variants initially
});

type ProductFormData = z.infer<typeof ProductFormSchema>;

// --- Component Props ---
interface AddProductDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  categories: Category[];
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

// --- Component ---
export default function AddProductDialog({
  isOpen,
  setIsOpen,
  categories,
  onSuccess,
  onError,
}: AddProductDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const baseBarcodeRef = useRef<HTMLInputElement>(null);
  const variantBarcodeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Effect to handle barcode scanner input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check if we're focused on any barcode input
      const activeElement = document.activeElement;
      const isBarcodeInput = activeElement
        ?.getAttribute("name")
        ?.includes("barcode");

      if (isBarcodeInput && e.key === "Enter") {
        e.preventDefault();
        // Find the next barcode input to focus (if any)
        const currentIndex = variantBarcodeRefs.current.findIndex(
          (ref) => ref === activeElement
        );

        if (
          currentIndex >= 0 &&
          currentIndex < variantBarcodeRefs.current.length - 1
        ) {
          variantBarcodeRefs.current[currentIndex + 1]?.focus();
        }
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, []);

  // Update the barcode input fields to use refs
  const updateVariantBarcodeRefs = (
    el: HTMLInputElement | null,
    index: number
  ) => {
    variantBarcodeRefs.current[index] = el;
  };
  const form = useForm({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",
      categoryId: "",
      basePrice: 0,
      reorderPoint: 5,
      isActive: true,
      variants: [], // Initialize variants array
    },
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  // --- Image Handling ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      // Basic validation (optional: add more checks for type, size)
      const newFiles = files.filter((file) => file.type.startsWith("image/"));
      setSelectedFiles((prev) => [...prev, ...newFiles]);

      // Generate previews
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  // --- Form Submission ---
  const onSubmit = (data: ProductFormData) => {
    setServerError(null);

    const formData = new FormData();

    // 1. Append standard product data
    Object.entries(data).forEach(([key, value]) => {
      if (key === "variants") return; // Handle variants separately
      if (value !== undefined && value !== null) {
        formData.append(key, String(value)); // Booleans are handled by String() correctly here
      }
    });
    // Handle potentially null barcode explicitly if needed by backend (String(null) -> "null")
    if (data.barcode === null || data.barcode === "") {
      // Don't append if default handling of null string is not desired
    } else {
      formData.append("barcode", data.barcode);
    }

    // 2. Append variants data as a JSON string
    // Filter out attributes with empty keys or values before stringifying
    const variantsWithCleanedAttributes = (data.variants ?? []).map(
      (variant) => ({
        ...variant,
        attributes: variant.attributes.filter(
          (attr) => attr.key.trim() !== "" && attr.value.trim() !== ""
        ),
      })
    );

    // Only append variants if there are any after cleaning
    if (variantsWithCleanedAttributes.length > 0) {
      formData.append(
        "variants",
        JSON.stringify(variantsWithCleanedAttributes)
      );
    }

    // 3. Append selected image files
    selectedFiles.forEach((file,) => {
      formData.append("images", file, file.name); // Key 'images' should match server action expectation
    });

    startTransition(async () => {
      // Ensure the server action `addProduct` is updated to handle FormData with variants and images
      const result = await addProduct(formData);

      if (result?.error) {
        setServerError(result.error);
        // Handle potential field-specific errors from the server for variants/etc.
        // This part might need refinement based on how the server action returns errors for arrays
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              // Basic field error setting, might need complex logic for array fields like variants
              form.setError(field as keyof ProductFormData, {
                // Might fail for nested paths
                type: "server",
                message: errors.join(", "),
              });
            }
          });
        }
        onError?.(result.error);
      } else {
        onSuccess?.(`Product "${result.product?.name}" added successfully!`);
        form.reset(); // Reset form
        setSelectedFiles([]); // Clear files
        setImagePreviews([]); // Clear previews
        setIsOpen(false); // Close dialog
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!isPending) {
      setIsOpen(open);
      if (!open) {
        form.reset();
        setServerError(null);
        setSelectedFiles([]);
        setImagePreviews([]);
      }
    }
  };

  // --- Variant Attribute Management ---
  // Helper to add attribute to a specific variant
  const addAttribute = (variantIndex: number) => {
    const variants = form.getValues("variants") || [];
    const updatedVariants = [...variants];
    if (updatedVariants[variantIndex]) {
      updatedVariants[variantIndex].attributes.push({ key: "", value: "" });
      form.setValue("variants", updatedVariants, { shouldValidate: true });
    }
  };

  // Helper to remove attribute from a specific variant
  const removeAttribute = (variantIndex: number, attributeIndex: number) => {
    const variants = form.getValues("variants") || [];
    const updatedVariants = [...variants];
    if (updatedVariants[variantIndex]) {
      updatedVariants[variantIndex].attributes.splice(attributeIndex, 1);
      form.setValue("variants", updatedVariants); // No need to validate on removal
    }
  };

  // --- Render ---
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        {" "}
        {/* Increased width */}
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the details, variants, and images for the new product.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          {/* Use ScrollArea for potentially long forms */}
          <ScrollArea className="max-h-[70vh] p-1 pr-5">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6" // Increased spacing
            >
              {serverError && (
                <p className="text-sm font-medium text-destructive bg-red-50 p-3 rounded-md">
                  {serverError}
                </p>
              )}

              {/* --- Basic Product Details --- */}
              <div className="space-y-4 p-4 border rounded-md">
                <h3 className="text-lg font-semibold mb-3">
                  Basic Information
                </h3>
                <FormField /* Name */
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      <FormLabel>
                        Product Name <span className="text-destructive">*</span>
                      </FormLabel>{" "}
                      <FormControl>
                        <Input
                          placeholder="e.g., Modern Desk Lamp"
                          {...field}
                        />
                      </FormControl>{" "}
                      <FormMessage />{" "}
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField /* SKU */
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        {" "}
                        <FormLabel>
                          Base SKU <span className="text-destructive">*</span>
                        </FormLabel>{" "}
                        <FormControl>
                          <Input placeholder="e.g., LAMP-MODERN" {...field} />
                        </FormControl>{" "}
                        <FormDescription>
                          Unique identifier for the base product.
                        </FormDescription>{" "}
                        <FormMessage />{" "}
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
                            ref={baseBarcodeRef}
                            placeholder="Optional: Scan or enter barcode"
                            value={field.value ?? ""}
                            onFocus={() => baseBarcodeRef.current?.select()}
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
                      {" "}
                      <FormLabel>
                        Category <span className="text-destructive">*</span>
                      </FormLabel>{" "}
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
                      <FormMessage />{" "}
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField /* Base Price */
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        {" "}
                        <FormLabel>
                          Base Selling Price ($){" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>{" "}
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="59.99"
                            {...field}
                          />
                        </FormControl>{" "}
                        <FormMessage />{" "}
                      </FormItem>
                    )}
                  />
                  <FormField /* Reorder Point */
                    control={form.control}
                    name="reorderPoint"
                    render={({ field }) => (
                      <FormItem>
                        {" "}
                        <FormLabel>Reorder Point</FormLabel>{" "}
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="5"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Low stock warning level.
                        </FormDescription>
                        <FormMessage />{" "}
                      </FormItem>
                    )}
                  />
                </div>
                <FormField /* Description */
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      <FormLabel>Description</FormLabel>{" "}
                      <FormControl>
                        <Textarea
                          placeholder="Optional: Describe the product..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>{" "}
                      <FormMessage />{" "}
                    </FormItem>
                  )}
                />
                <FormField /* Is Active */
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-gray-50">
                      {" "}
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>{" "}
                      <div className="space-y-1 leading-none">
                        {" "}
                        <FormLabel>Product Active</FormLabel>{" "}
                        <FormDescription className="text-xs">
                          Inactive products won&apos;t appear in sales or
                          default lists.
                        </FormDescription>
                      </div>{" "}
                    </FormItem>
                  )}
                />
              </div>

              {/* --- Product Variants Section --- */}
              <div className="space-y-4 p-4 border rounded-md">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Product Variants</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendVariant({
                        sku: "",
                        priceModifier: 0,
                        attributes: [{ key: "", value: "" }],
                        isActive: true,
                      })
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
                  </Button>
                </div>
                {variantFields.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    This product currently has no variants. Add variants if it
                    comes in different options (e.g., color, size).
                  </p>
                )}

                {variantFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 border rounded-md space-y-3 relative bg-gray-50/50"
                  >
                    {/* Remove Variant Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-red-100"
                      onClick={() => removeVariant(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove Variant</span>
                    </Button>

                    <h4 className="text-md font-medium text-gray-700">
                      Variant {index + 1}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField /* Variant SKU */
                        control={form.control}
                        name={`variants.${index}.sku`}
                        render={({ field: variantField }) => (
                          <FormItem>
                            {" "}
                            <FormLabel>
                              Variant SKU{" "}
                              <span className="text-destructive">*</span>
                            </FormLabel>{" "}
                            <FormControl>
                              <Input
                                placeholder="e.g., LAMP-MODERN-BLK"
                                {...variantField}
                              />
                            </FormControl>{" "}
                            <FormMessage />{" "}
                          </FormItem>
                        )}
                      />
                      <FormField /* Variant Price Modifier */
                        control={form.control}
                        name={`variants.${index}.priceModifier`}
                        render={({ field: variantField }) => (
                          <FormItem>
                            {" "}
                            <FormLabel>Price Modifier ($)</FormLabel>{" "}
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00 or e.g., 10.00 or -5.00"
                                {...variantField}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Added to base price. Can be negative.
                            </FormDescription>
                            <FormMessage />{" "}
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField /* Variant Barcode */
                      control={form.control}
                      name={`variants.${index}.barcode`}
                      render={({ field: variantField }) => (
                        <FormItem>
                          <FormLabel>Variant Barcode</FormLabel>
                          <FormControl>
                            <Input
                              {...variantField}
                              ref={(el) => updateVariantBarcodeRefs(el, index)}
                              placeholder="Optional: Variant-specific barcode"
                              value={variantField.value ?? ""}
                              onFocus={(e) => e.target.select()}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* --- Attributes Section --- */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-sm font-medium">
                          Attributes
                        </FormLabel>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => addAttribute(index)}
                        >
                          <PlusCircle className="mr-1 h-3 w-3" /> Add Attribute
                        </Button>
                      </div>
                      {/* Map through attributes for this variant */}
                      {form
                        .watch(`variants.${index}.attributes`)
                        ?.map((_, attrIndex) => (
                          <div
                            key={attrIndex}
                            className="flex items-center gap-2"
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
                              className="h-8 w-8 text-destructive shrink-0"
                              onClick={() => removeAttribute(index, attrIndex)}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Remove Attribute</span>
                            </Button>
                          </div>
                        ))}
                      {/* Display validation message for the attributes array itself */}
                      {form.formState.errors.variants?.[index]?.attributes
                        ?.message && (
                        <p className="text-xs font-medium text-destructive">
                          {
                            form.formState.errors.variants?.[index]?.attributes
                              ?.message
                          }
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {/* Display root error for variants array if any */}
                {form.formState.errors.variants?.root?.message && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.variants?.root?.message}
                  </p>
                )}
              </div>

              {/* --- Image Upload Section --- */}
              <div className="space-y-4 p-4 border rounded-md">
                <h3 className="text-lg font-semibold mb-3">Product Images</h3>
                <div className="grid gap-4">
                  {/* File Input */}
                  <FormItem className="w-full">
                    <FormLabel
                      htmlFor="file-upload"
                      className="cursor-pointer block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
                    >
                      <UploadCloud className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                      <span className="font-medium text-blue-600">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF, WEBP (Max 5MB each)
                      </p>
                      <FormControl>
                        <Input
                          id="file-upload"
                          type="file"
                          multiple
                          accept="image/png, image/jpeg, image/gif, image/webp"
                          className="sr-only" // Hide default input visually
                          onChange={handleFileChange}
                        />
                      </FormControl>
                    </FormLabel>
                    <FormMessage /> {/* For potential file-related errors */}
                  </FormItem>

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {imagePreviews.map((previewUrl, index) => (
                        <div
                          key={index}
                          className="relative aspect-square border rounded-md overflow-hidden group"
                        >
                          <Image
                            src={previewUrl}
                            alt={`Preview ${index + 1}`}
                            fill
                            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw" // Optimize sizes
                            className="object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-80 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">
                              Remove image {index + 1}
                            </span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedFiles.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No images selected.
                    </p>
                  )}
                </div>
              </div>

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
                  {isPending ? "Saving..." : "Save Product"}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
