"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addProduct, updateProduct } from "@/actions/stock.actions"; // Adjust path
import { Category } from "@prisma/client"; // Assuming Category type from Prisma

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, PlusCircle, Trash2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area"; 

// Example: Base Variant Schema (adjust fields as per your needs)
const VariantSchema = z.object({
  id: z.string().cuid().optional(), // Optional for creation
  name: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional().nullable(),
  priceModifier: z.coerce.number(), // Coerce from string/number
  attributes: z.record(z.any()).optional(), // Basic JSON validation
  isActive: z.boolean().default(true),
  reorderPoint: z.coerce.number().int().positive().default(5),
  reorderQty: z.coerce.number().int().positive().default(10),
  lowStockAlert: z.boolean().default(false),
  // Ensure fields match your ProductVariant model
});

const ProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  sku: z.string().min(1),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().min(1),
  basePrice: z.coerce.number(), // Coerce from string/number
  reorderPoint: z.coerce.number().int().positive().default(5),
  isActive: z.boolean().default(true),
  imageUrls: z.array(z.string()).optional(),
  variants: z.array(VariantSchema).optional().default([]), // Array of variants
  // Ensure fields match your Product model
});

const EditProductSchema = ProductSchema.extend({
  id: z.string().cuid(),
  // Allow variants to have IDs during update
  // variants: z.array(VariantSchema).optional().default([]),
});

type ProductFormData =
  | z.infer<typeof ProductSchema>
  | z.infer<typeof EditProductSchema>;
type VariantFormData = z.infer<typeof VariantSchema>;

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: ProductFormData & { id?: string }; // Product data for editing
  categories: Category[];
  onSuccess: () => void; // Callback after successful save
}

export function ProductDialog({
  isOpen,
  onClose,
  productToEdit,
  categories,
  onSuccess,
}: ProductDialogProps) {
  const isEditing = !!productToEdit?.id;
  const formSchema = isEditing ? EditProductSchema : ProductSchema;

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing
      ? {
          ...productToEdit,
          // Ensure correct types for form fields if necessary
          basePrice: productToEdit.basePrice
            ? Number(productToEdit.basePrice)
            : 0,
          reorderPoint: productToEdit.reorderPoint ?? 5,
          isActive: productToEdit.isActive ?? true,
          variants:
            productToEdit.variants?.map((v) => ({
              ...v,
              priceModifier: v.priceModifier ? Number(v.priceModifier) : 0,
              // Ensure attributes array exists
              attributes: Array.isArray(v.attributes) ? v.attributes : [],
            })) || [],
        }
      : {
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
  } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  // Reset form when dialog closes or productToEdit changes
  useEffect(() => {
    if (isOpen) {
      form.reset(
        isEditing
          ? {
              ...productToEdit,
              basePrice: productToEdit.basePrice
                ? Number(productToEdit.basePrice)
                : 0,
              reorderPoint: productToEdit.reorderPoint ?? 5,
              isActive: productToEdit.isActive ?? true,
              variants:
                productToEdit.variants?.map((v) => ({
                  ...v,
                  priceModifier: v.priceModifier ? Number(v.priceModifier) : 0,
                  attributes: Array.isArray(v.attributes) ? v.attributes : [],
                })) || [],
            }
          : {
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
            }
      );
    }
  }, [isOpen, productToEdit, isEditing, form.reset]); // form.reset added

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    const formData = new FormData();

    // Append standard fields
    Object.entries(data).forEach(([key, value]) => {
      if (
        key !== "variants" &&
        key !== "imageUrls" &&
        value !== null &&
        value !== undefined
      ) {
        formData.append(key, String(value));
      }
      // Handle boolean specifically for 'on' value from checkbox if needed
      if (key === "isActive") {
        formData.append(key, String(value));
      }
    });

    // Append Variants as JSON string
    if (data.variants) {
      formData.append("variants", JSON.stringify(data.variants));
    }

    // Handle image URLs (assuming they are just strings for now)
    data.imageUrls?.forEach((url) => formData.append("imageUrls", url));

    try {
      let result;
      if (isEditing && data.id) {
        formData.append("id", data.id); // Add ID for update
        result = await updateProduct(formData);
      } else {
        result = await addProduct(formData);
      }

      if (result.success) {
        toast.success(
          `Product ${isEditing ? "updated" : "added"} successfully!`
        );
        onSuccess(); // Trigger refetch/revalidation in parent
        onClose();
      } else {
        // Display specific field errors if available
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            // Need to map potential nested variant errors too
            form.setError(field as keyof ProductFormData, {
              type: "manual",
              message: errors?.join(", "),
            });
          });
          toast.error(
            `Validation failed: ${result.error || "Please check the form."}`
          );
        } else {
          toast.error(`Error: ${result.error || "An unknown error occurred."}`);
        }
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred during submission.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewVariant = () => {
    appendVariant({
      skuSuffix: "",
      barcode: "",
      priceModifier: 0,
      attributes: [{ name: "", value: "" }], // Start with one empty attribute
    });
  };

  const handleAddNewAttribute = (variantIndex: number) => {
    // This requires a way to target the specific variant's attribute array
    // using useFieldArray's append function with the correct path.
    // A sub-component for VariantFormSection often makes this easier.
    // For simplicity here, we'll assume direct manipulation (less ideal with react-hook-form)
    const variants = form.getValues("variants") || [];
    if (variants[variantIndex]) {
      const updatedAttributes = [
        ...(variants[variantIndex].attributes || []),
        { name: "", value: "" },
      ];
      form.setValue(`variants.${variantIndex}.attributes`, updatedAttributes, {
        shouldValidate: true,
      });
    }
  };

  const handleRemoveAttribute = (
    variantIndex: number,
    attributeIndex: number
  ) => {
    const variants = form.getValues("variants") || [];
    if (variants[variantIndex] && variants[variantIndex].attributes) {
      const updatedAttributes = variants[variantIndex].attributes.filter(
        (_, idx) => idx !== attributeIndex
      );
      form.setValue(`variants.${variantIndex}.attributes`, updatedAttributes, {
        shouldValidate: true,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
        <ScrollArea className="max-h-[80vh] p-6">
          {" "}
          {/* Add ScrollArea */}
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-4"
          >
            {/* Core Product Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" {...form.register("sku")} />
                {form.formState.errors.sku && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.sku.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="categoryId">Category *</Label>
                <Select
                  onValueChange={(value) =>
                    form.setValue("categoryId", value, { shouldValidate: true })
                  }
                  defaultValue={form.getValues("categoryId")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.categoryId.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="basePrice">Base Price *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  {...form.register("basePrice", { valueAsNumber: true })}
                />
                {form.formState.errors.basePrice && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.basePrice.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...form.register("description")} />
                {form.formState.errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="barcode">Barcode (Base)</Label>
                <Input id="barcode" {...form.register("barcode")} />
                {form.formState.errors.barcode && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.barcode.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="reorderPoint">Reorder Point</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  step="1"
                  {...form.register("reorderPoint", { valueAsNumber: true })}
                />
                {form.formState.errors.reorderPoint && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.reorderPoint.message}
                  </p>
                )}
              </div>
              {/* Add Image URL input(s) here if needed */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={form.watch("isActive")}
                  onCheckedChange={(checked) =>
                    form.setValue("isActive", Boolean(checked))
                  }
                />
                <Label htmlFor="isActive">Product is Active</Label>
                {form.formState.errors.isActive && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.isActive.message}
                  </p>
                )}
              </div>
            </div>

            {/* Variants Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Variants</h3>
              {variantFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border rounded-md bg-muted/50 relative space-y-3"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    onClick={() => removeVariant(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`variants.${index}.skuSuffix`}>
                        SKU Suffix
                      </Label>
                      <Input
                        id={`variants.${index}.skuSuffix`}
                        {...form.register(`variants.${index}.skuSuffix`)}
                        placeholder="e.g., -RED-L"
                      />
                      {form.formState.errors.variants?.[index]?.skuSuffix && (
                        <p className="text-red-500 text-sm mt-1">
                          {
                            form.formState.errors.variants[index].skuSuffix
                              .message
                          }
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`variants.${index}.barcode`}>
                        Variant Barcode
                      </Label>
                      <Input
                        id={`variants.${index}.barcode`}
                        {...form.register(`variants.${index}.barcode`)}
                      />
                      {form.formState.errors.variants?.[index]?.barcode && (
                        <p className="text-red-500 text-sm mt-1">
                          {
                            form.formState.errors.variants[index].barcode
                              .message
                          }
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`variants.${index}.priceModifier`}>
                        Price Modifier (+/-)
                      </Label>
                      <Input
                        id={`variants.${index}.priceModifier`}
                        type="number"
                        step="0.01"
                        {...form.register(`variants.${index}.priceModifier`, {
                          valueAsNumber: true,
                        })}
                        placeholder="e.g., 5.00 or -2.50"
                      />
                      {form.formState.errors.variants?.[index]
                        ?.priceModifier && (
                        <p className="text-red-500 text-sm mt-1">
                          {
                            form.formState.errors.variants[index].priceModifier
                              .message
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Variant Attributes */}
                  <div className="space-y-2 pt-2">
                    <Label className="text-sm font-medium">Attributes</Label>
                    {/* Need to use useFieldArray again here for attributes, or manage manually */}
                    {(form.watch(`variants.${index}.attributes`) || []).map(
                      (attr, attrIndex) => (
                        <div
                          key={attrIndex}
                          className="flex items-center gap-2"
                        >
                          <Input
                            {...form.register(
                              `variants.${index}.attributes.${attrIndex}.name`
                            )}
                            placeholder="e.g., Color"
                            className="flex-1"
                          />
                          <Input
                            {...form.register(
                              `variants.${index}.attributes.${attrIndex}.value`
                            )}
                            placeholder="e.g., Red"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleRemoveAttribute(index, attrIndex)
                            }
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      )
                    )}
                    {form.formState.errors.variants?.[index]?.attributes
                      ?.message && (
                      <p className="text-red-500 text-sm mt-1">
                        {
                          form.formState.errors.variants[index].attributes
                            .message
                        }
                      </p>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddNewAttribute(index)}
                      className="mt-2"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" /> Add Attribute
                    </Button>
                  </div>
                </div>
              ))}
              {form.formState.errors.variants?.message && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.variants.message}
                </p>
              )}{" "}
              {/* Root error for variants array */}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddNewVariant}
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Add Variant
              </Button>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
