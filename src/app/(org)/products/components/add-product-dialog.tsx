"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Category, Prisma } from "@prisma/client";
import Image from "next/image";
import {
  Trash2, PlusCircle, X, UploadCloud, AlertCircle, 
  Loader2, Camera, Package, Tag, DollarSign, Info,
  Layers, Check, ShoppingCart, Image as ImageIcon, Palette
} from "lucide-react";

// Import API utilities instead of direct server actions
import { apiAddProduct, apiUpdateProduct } from "@/lib/api/products";
import { uploadSanityAsset } from "@/actions/uploads";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Form, FormControl, FormDescription,
  FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- Zod Schemas ---
const AttributeSchema = z.object({
  key: z.string().min(1, "Attribute name cannot be empty"),
  value: z.string().min(1, "Attribute value cannot be empty"),
});

const VariantSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().optional(),
  sku: z.string().min(1, "Variant SKU is required"),
  barcode: z.string().optional().nullable(),
  priceModifier: z.coerce.number().default(0),
  attributes: z
    .array(AttributeSchema)
    .min(1, "At least one attribute is required per variant"),
  isActive: z.boolean().default(true),
  reorderPoint: z.coerce.number().int().min(0).default(5),
  reorderQty: z.coerce.number().int().min(0).default(10),
  lowStockAlert: z.boolean().default(false),
});

const ProductFormSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional().nullable(),
  sku: z.string().min(1, "Base SKU is required"),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  basePrice: z.coerce.number().min(0, "Base price must be non-negative"),
  reorderPoint: z.coerce.number().int().min(0).default(5),
  isActive: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).optional().default([]),
  variants: z.array(VariantSchema).optional().default([]),
});

type ProductFormData = z.infer<typeof ProductFormSchema>;
type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true };
}>;

// --- Component Props ---
interface ProductDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  categories: Category[];
  initialData?: ProductWithVariants | null;
  onSuccess?: (message: string, updatedProduct?: ProductWithVariants) => void;
  onError?: (message: string) => void;
}

// --- Component ---
export default function ProductDialog({
  isOpen,
  setIsOpen,
  categories,
  initialData = null,
  onSuccess,
  onError,
}: ProductDialogProps) {
  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  
  // Image management
  const [newlySelectedFiles, setNewlySelectedFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [imageBeingPreviewed, setImageBeingPreviewed] = useState<string | null>(null);
  
  // Determine mode
  const isEditMode = !!initialData;
  const dialogTitle = isEditMode ? "Edit Product" : "Add New Product";
  const submitButtonText = isEditMode ? "Save Changes" : "Add Product";

  useEffect(() => {
    if (initialData?.imageUrls && Array.isArray(initialData.imageUrls)) {
      setExistingImageUrls(initialData.imageUrls);
    }
  }, [initialData]);

  // Form definition with default values
  const form = useForm({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: isEditMode && initialData
      ? {
          ...initialData,
          basePrice: typeof initialData.basePrice === 'number' 
            ? initialData.basePrice 
            : parseFloat(initialData.basePrice.toString()),
          variants: initialData.variants?.map((v) => ({
            ...v,
            priceModifier: typeof v.priceModifier === 'number'
              ? v.priceModifier
              : parseFloat(v.priceModifier.toString()),
            attributes: typeof v.attributes === 'object' && v.attributes !== null
              ? Object.entries(v.attributes).map(([key, value]) => ({
                  key,
                  value: String(value),
                }))
              : [],
          })) ?? [],
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
  });

  // Set up field arrays for variants
  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  // --- Image Handling Functions ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      
      // For each file, create a preview
      const newPreviews: string[] = [];
      const validFiles: File[] = [];
      
      imageFiles.forEach(file => {
        if (file.size <= 5 * 1024 * 1024) { // 5MB limit
          validFiles.push(file);
          newPreviews.push(URL.createObjectURL(file));
        }
      });
      
      setNewlySelectedFiles(prev => [...prev, ...validFiles]);
      setNewImagePreviews(prev => [...prev, ...newPreviews]);
    }
    
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  // Remove a newly selected image (before upload)
  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]); // Cleanup preview URL
    setNewlySelectedFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Remove an already existing image
  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
    
    // Update form state for submission
    form.setValue(
      "imageUrls",
      existingImageUrls.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
  };

  // Preview an image in larger view
  const previewImage = (url: string) => {
    setImageBeingPreviewed(url);
  };

  // Close the image preview
  const closeImagePreview = () => {
    setImageBeingPreviewed(null);
  };

  // --- Helper Functions for Variants ---
  const addAttribute = (variantIndex: number) => {
    const currentAttributes = form.getValues(`variants.${variantIndex}.attributes`) || [];
    form.setValue(
      `variants.${variantIndex}.attributes`,
      [...currentAttributes, { key: "", value: "" }],
      { shouldValidate: true }
    );
  };

  // Remove attribute from a variant
  const removeAttribute = (variantIndex: number, attributeIndex: number) => {
    const currentAttributes = form.getValues(`variants.${variantIndex}.attributes`) || [];
    form.setValue(
      `variants.${variantIndex}.attributes`,
      currentAttributes.filter((_, i) => i !== attributeIndex),
      { shouldValidate: false }
    );
  };

  // Reset the dialog state
  const resetDialogState = () => {
    form.reset(isEditMode && initialData
      ? {
          ...initialData,
          basePrice: typeof initialData.basePrice === 'number' 
            ? initialData.basePrice 
            : parseFloat(initialData.basePrice.toString()),
          variants: initialData.variants?.map((v) => ({
            ...v,
            priceModifier: typeof v.priceModifier === 'number'
              ? v.priceModifier
              : parseFloat(v.priceModifier.toString()),
            attributes: typeof v.attributes === 'object' && v.attributes !== null
              ? Object.entries(v.attributes).map(([key, value]) => ({
                  key,
                  value: String(value),
                }))
              : [],
          })) ?? [],
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
    
    setServerError(null);
    setNewlySelectedFiles([]);
    setNewImagePreviews([]);
    setExistingImageUrls(isEditMode ? (initialData?.imageUrls ?? []) : []);
    setActiveTab("general");
  };

  // Handle dialog open/close
  const handleOpenChange = (open: boolean) => {
    if (!isProcessing && !isUploading) {
      setIsOpen(open);
      if (!open) {
        resetDialogState();
      }
    }
  };

  // --- Form Submission ---
  const onSubmit = async (data: ProductFormData) => {
    setServerError(null);
    setIsProcessing(true);
    setIsUploading(true);

    try {
      // 1. Upload NEW images first
      const uploadedUrls: string[] = [];
      const uploadErrors: string[] = [];

      for (const file of newlySelectedFiles) {
        const result = await uploadSanityAsset(
          file as unknown as File, 
          "image", 
          "image"
        );
        
        if (result) {
          uploadedUrls.push(result);
        } else {
          uploadErrors.push(`Failed to upload ${file.name}`);
        }
      }

      setIsUploading(false);

      // Handle upload errors
      if (uploadErrors.length > 0) {
        setServerError(`Image upload failed: ${uploadErrors.join("; ")}`);
        onError?.(`Image upload failed: ${uploadErrors.join("; ")}`);
        setIsProcessing(false);
        return;
      }

      // 2. Prepare data for API call
      const finalImageUrls = [...existingImageUrls, ...uploadedUrls];
      const formData = new FormData();

      // Convert form data to FormData
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

      // Handle barcode field
      if (data.barcode) {
        formData.append("barcode", data.barcode);
      }

      // Format variants for API
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

      // Add image URLs
      finalImageUrls.forEach((url) => {
        formData.append("imageUrls", url);
      });

      // Append ID if in edit mode
      if (isEditMode && data.id) {
        formData.append("id", data.id);
      }

      // 3. Call the appropriate API
      const result = isEditMode 
        ? await apiUpdateProduct(formData)
        : await apiAddProduct(formData);

      if (result?.error) {
        setServerError(result.error);
        
        // Handle field-specific errors
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
        // Success!
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
      const errorMsg = e instanceof Error ? e.message : "An unexpected error occurred.";
      setServerError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      newImagePreviews.forEach(URL.revokeObjectURL);
    };
  }, [newImagePreviews]);

  // Determine loading state
  const isLoading = isProcessing || isUploading;

  // --- Render Dialog Structure ---
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold">{dialogTitle}</DialogTitle>
          <DialogDescription>{isEditMode ? 
            "Update this product's details, variants, and images." : 
            "Create a new product with details, variants, and images."}</DialogDescription>
        </DialogHeader>
        
        {/* Server Error Message */}
        {serverError && (
          <div className="mx-6 p-3 rounded-md bg-destructive/10 border border-destructive/30 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <p className="text-sm font-medium text-destructive">{serverError}</p>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="px-6 pt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-muted">
              <TabsTrigger value="general" className="flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger value="variants" className="flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                <span>Variants</span>
                {variantFields.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {variantFields.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4" />
                <span>Images</span>
                {(existingImageUrls.length + newImagePreviews.length) > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {existingImageUrls.length + newImagePreviews.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Main Content Container */}
            <Form {...form}>
              <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <ScrollArea className="flex-grow overflow-auto max-h-[calc(100vh-250px)] px-1 py-4">
                  <div className="space-y-6 pb-6 px-1">
                  
                    {/* General Tab Content */}
                    <TabsContent value="general" className="mt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column - Basic Info */}
                        <Card className="col-span-2">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold flex items-center">
                              <Info className="mr-2 h-5 w-5 text-muted-foreground" />
                              Basic Information
                            </CardTitle>
                            <CardDescription>
                              Essential details about your product
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Product Name <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Premium Ergonomic Chair" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="sku"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      Base SKU <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., CHAIR-ERGO-PREM"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                      Unique identifier for this product
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
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
                            
                            <FormField
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
                            
                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Optional: Describe features, materials, etc."
                                      className="min-h-[120px] resize-none"
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </CardContent>
                        </Card>
                        
                        {/* Right Column - Pricing & Status */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold flex items-center">
                              <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
                              Pricing & Status
                            </CardTitle>
                            <CardDescription>
                              Set pricing and availability 
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <FormField
                              control={form.control}
                              name="basePrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Base Selling Price ($) <span className="text-destructive">*</span>
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
                                  <FormDescription className="text-xs">
                                    Starting price before variant modifiers
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
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
                                    Inventory level to trigger restock alerts
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-background shadow-sm">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Product Active</FormLabel>
                                    <FormDescription className="text-xs">
                                      Inactive products are hidden from POS and catalogs
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />
                            
                            {isEditMode && initialData?.id && (
                              <div className="pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                  <p className="font-medium">Product ID:</p>
                                  <p className="font-mono text-xs mt-1 break-all">{initialData.id}</p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  
                    {/* Variants Tab Content */}
                    <TabsContent value="variants" className="mt-0 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold">Product Variants</h3>
                          <p className="text-sm text-muted-foreground">Create variations like size, color, etc.</p>
                        </div>
                        <Button
                          type="button"
                          onClick={() =>
                            appendVariant({
                              sku: `${form.getValues("sku")}-VAR${variantFields.length + 1}`,
                              attributes: [{ key: "", value: "" }],
                              priceModifier: 0,
                              isActive: true,
                              reorderPoint: form.getValues("reorderPoint"),
                              reorderQty: 10,
                              lowStockAlert: false,
                            })
                          }
                          disabled={isLoading}
                          className="group"
                        >
                          <PlusCircle className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                          Add Variant
                        </Button>
                      </div>
                      
                      {/* No variants message */}
                      {variantFields.length === 0 && (
                        <Card className="bg-muted/40 border-dashed">
                          <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center min-h-[200px]">
                            <Palette className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                            <p className="text-center text-muted-foreground">
                              No variants added yet. Add variations like size, color, or material.
                            </p>
                            <Button
                              variant="outline"
                              className="mt-4"
                              onClick={() =>
                                appendVariant({
                                  sku: `${form.getValues("sku")}-VAR1`,
                                  attributes: [{ key: "", value: "" }],
                                  priceModifier: 0,
                                  isActive: true,
                                  reorderPoint: form.getValues("reorderPoint"),
                                  reorderQty: 10,
                                  lowStockAlert: false,
                                })
                              }
                              disabled={isLoading}
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Add First Variant
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Variant Cards */}
                      <div className="space-y-6">
                        {variantFields.map((field, index) => (
                          <Card key={field.id} className="relative overflow-visible">
                            {/* Remove Variant Button */}
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-3 -right-3 h-7 w-7 rounded-full shadow-md z-10 hover:scale-110 transition-transform"
                              onClick={() => removeVariant(index)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove Variant</span>
                            </Button>
                            
                            {/* Variant ID Badge */}
                            {field.id && (
                              <Badge
                                variant="outline"
                                className="absolute -top-2 left-4 text-xs font-mono"
                              >
                                ID: {field.id.substring(0, 8)}...
                              </Badge>
                            )}
                            
                            <CardHeader className={field.id ? "pt-6" : "pt-4"}>
                              <CardTitle className="text-base font-medium flex items-center">
                                <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                                Variant {index + 1}
                              </CardTitle>
                            </CardHeader>
                            
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.sku`}
                                  render={({ field: variantField }) => (
                                    <FormItem>
                                      <FormLabel>
                                        Variant SKU <span className="text-destructive">*</span>
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="e.g., CHAIR-BLK"
                                          {...variantField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.priceModifier`}
                                  render={({ field: variantField }) => (
                                    <FormItem>
                                      <FormLabel>Price Modifier ($)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="+10.00"
                                          {...variantField}
                                        />
                                      </FormControl>
                                      <FormDescription className="text-xs">
                                        Amount added to base price
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.barcode`}
                                  render={({ field: variantField }) => (
                                    <FormItem>
                                      <FormLabel>Variant Barcode</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Optional barcode"
                                          {...variantField}
                                          value={variantField.value ?? ""}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              {/* Variant Attributes */}
                              <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center">
                                  <FormLabel className="font-medium text-sm">
                                    Attributes <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addAttribute(index)}
                                    disabled={isLoading}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <PlusCircle className="mr-1 h-3 w-3" />
                                    Add Attribute
                                  </Button>
                                </div>
                                
                                <div className="bg-muted/30 rounded-md p-3 space-y-2">
                                  {form.watch(`variants.${index}.attributes`)?.map((_, attrIndex) => (
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
                                                placeholder="Type (e.g., Color)"
                                                {...attrField}
                                                className="h-9"
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
                                                placeholder="Value (e.g., Black)"
                                                {...attrField}
                                                className="h-9"
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
                                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeAttribute(index, attrIndex)}
                                        disabled={isLoading}
                                      >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Remove Attribute</span>
                                      </Button>
                                    </div>
                                  ))}
                                  
                                  {/* Attributes validation message */}
                                  {form.formState.errors.variants?.[index]?.attributes?.message && (
                                    <p className="text-xs font-medium text-destructive pt-1">
                                      {form.formState.errors.variants?.[index]?.attributes?.message as string}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <Separator className="my-2" />
                              
                              {/* Variant Settings */}
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.reorderPoint`}
                                  render={({ field: vf }) => (
                                    <FormItem>
                                      <FormLabel className="text-sm">Reorder Point</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="1"
                                          min="0"
                                          placeholder="5"
                                          {...vf}
                                          className="h-9"
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
                                      <FormLabel className="text-sm">Reorder Qty</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="1"
                                          min="0"
                                          placeholder="10"
                                          {...vf}
                                          className="h-9"
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.isActive`}
                                  render={({ field: vf }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-1">
                                      <FormControl>
                                        <Checkbox
                                          checked={vf.value}
                                          onCheckedChange={vf.onChange}
                                          id={`var-active-${index}`}
                                        />
                                      </FormControl>
                                      <FormLabel
                                        htmlFor={`var-active-${index}`}
                                        className="text-sm font-normal"
                                      >
                                        Active
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.lowStockAlert`}
                                  render={({ field: vf }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-1">
                                      <FormControl>
                                        <Checkbox
                                          checked={vf.value}
                                          onCheckedChange={vf.onChange}
                                          id={`var-lowstock-${index}`}
                                        />
                                      </FormControl>
                                      <FormLabel
                                        htmlFor={`var-lowstock-${index}`}
                                        className="text-sm font-normal"
                                      >
                                        Low Stock Alert
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        
                        {/* Variant array error messages */}
                        {form.formState.errors.variants?.root?.message && (
                          <p className="text-sm font-medium text-destructive">
                            {form.formState.errors.variants?.root?.message}
                          </p>
                        )}
                        {form.formState.errors.variants?.message && !form.formState.errors.variants?.root?.message && (
                          <p className="text-sm font-medium text-destructive">
                            {form.formState.errors.variants?.message}
                          </p>
                        )}
                      </div>
                    </TabsContent>
                    
                    {/* Images Tab Content */}
                    <TabsContent value="images" className="mt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column - Upload Area */}
                        <Card className="md:col-span-1">
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center">
                              <UploadCloud className="mr-2 h-5 w-5 text-muted-foreground" />
                              Upload Images
                            </CardTitle>
                            <CardDescription>
                              Add product photos
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* File Input */}
                            <FormItem className="w-full">
                              <FormLabel
                                htmlFor="file-upload"
                                className={cn(
                                  "cursor-pointer block border-2 border-dashed border-primary/20 rounded-lg p-6 text-center hover:border-primary/50 transition-colors bg-muted/30",
                                  isLoading && "opacity-60 cursor-not-allowed"
                                )}
                              >
                                <UploadCloud className="mx-auto h-12 w-12 text-primary/30 mb-3" />
                                <span className="font-medium text-primary">Click to upload</span>
                                <span className="text-muted-foreground block text-sm"> or drag and drop</span>
                                <p className="text-xs text-muted-foreground mt-2">
                                  PNG, JPG, WEBP (Max 5MB)
                                </p>
                                <FormControl>
                                  <Input
                                    id="file-upload"
                                    type="file"
                                    multiple
                                    accept="image/png, image/jpeg, image/webp, image/gif"
                                    className="sr-only"
                                    onChange={handleFileChange}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                              </FormLabel>
                              <FormMessage />
                            </FormItem>
                            
                            {/* Upload Status */}
                            {isUploading && (
                              <div className="mt-4 p-2 bg-primary/5 rounded-md flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                                <span className="text-sm">Uploading images...</span>
                              </div>
                            )}
                            
                            {/* New Images Counter */}
                            {newImagePreviews.length > 0 && (
                              <div className="mt-4 flex items-center justify-between">
                                <span className="text-sm font-medium">New images</span>
                                <Badge variant="outline">
                                  {newImagePreviews.length}
                                </Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        
                        {/* Right Column - Image Gallery */}
                        <Card className="md:col-span-2">
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center">
                              <ImageIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                              Product Gallery
                            </CardTitle>
                            <CardDescription>
                              Manage product images
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* No images message */}
                            {existingImageUrls.length === 0 && newImagePreviews.length === 0 && (
                              <div className="text-center p-8 border border-dashed rounded-lg bg-muted/30">
                                <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground">No images have been added yet</p>
                              </div>
                            )}
                            
                            {/* Image Grid */}
                            {(existingImageUrls.length > 0 || newImagePreviews.length > 0) && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {/* Existing Images */}
                                {existingImageUrls.map((url, index) => (
                                  <div
                                    key={`existing-${index}`}
                                    className="group relative aspect-square border rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    <Image
                                      src={url}
                                      alt={`Product Image ${index + 1}`}
                                      fill
                                      sizes="(max-width: 640px) 50vw, 33vw"
                                      className="object-cover transition-transform group-hover:scale-105"
                                      onClick={() => previewImage(url)}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          size="icon"
                                          className="h-8 w-8 rounded-full bg-white"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            previewImage(url);
                                          }}
                                        >
                                          <Camera className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="icon"
                                          className="h-8 w-8 rounded-full"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeExistingImage(index);
                                          }}
                                          disabled={isLoading}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <Badge
                                      variant="secondary" 
                                      className="absolute top-2 left-2 bg-black/60 text-white"
                                    >
                                      Existing
                                    </Badge>
                                  </div>
                                ))}
                                
                                {/* New Image Previews */}
                                {newImagePreviews.map((previewUrl, index) => (
                                  <div
                                    key={`new-${index}`}
                                    className="group relative aspect-square border-2 border-primary/30 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    <Image
                                      src={previewUrl}
                                      alt={`New Image ${index + 1}`}
                                      fill
                                      sizes="(max-width: 640px) 50vw, 33vw"
                                      className="object-cover transition-transform group-hover:scale-105"
                                      onClick={() => previewImage(previewUrl)}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          size="icon"
                                          className="h-8 w-8 rounded-full bg-white"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            previewImage(previewUrl);
                                          }}
                                        >
                                          <Camera className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="icon"
                                          className="h-8 w-8 rounded-full"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeNewImage(index);
                                          }}
                                          disabled={isLoading}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <Badge
                                      variant="secondary" 
                                      className="absolute top-2 left-2 bg-primary/80 text-white"
                                    >
                                      New
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </form>
            </Form>
          </Tabs>
        </div>
        
        {/* Dialog Footer with Submit Buttons */}
        <DialogFooter className="px-6 py-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="product-form" 
            disabled={isLoading}
            className={isLoading ? "opacity-80" : ""}
          >
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
      
      {/* Modal for enlarged image preview */}
      {imageBeingPreviewed && (
        <Dialog open={!!imageBeingPreviewed} onOpenChange={() => closeImagePreview()}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden">
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              <Image
                src={imageBeingPreviewed}
                alt="Image preview"
                fill
                className="object-contain"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => closeImagePreview()}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
