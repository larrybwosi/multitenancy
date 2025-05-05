'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trash2, Loader2, CircleAlert, PackagePlus, ImagePlus, Edit } from 'lucide-react';
import Image from 'next/image';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useCategories } from '@/lib/hooks/use-categories';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocations } from '@/lib/hooks/use-supplier';
import { DragOverlay } from '@/components/ui/drag-overlay';
import { VariantModal } from '../add/variant';
import { Checkbox } from '@/components/ui/checkbox';
import { Prisma } from '@/prisma/client';
import Loading from './loading';
import {
  AddProductSchema,
  EditProductSchema,
  ProductVariantInput,
  ProductSupplierInput,
  AddProductSchemaType,
  EditProductSchemaType,
} from '@/lib/validations/product';

type ProductFormType = AddProductSchemaType | EditProductSchemaType;

type ProductForEditing = EditProductSchemaType & {
  id: string;
  variants: (ProductVariantInput & { id?: string })[];
  suppliers: (ProductSupplierInput & { id?: string })[];
};

interface AddProductFormProps {
  product?: ProductForEditing;
}

export default function AddProductForm({ product }: AddProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{ file: File; preview: string }[]>([]);

  const isEditMode = !!product?.id;
  const currentSchema = isEditMode ? EditProductSchema : AddProductSchema;

  const form = useForm<ProductFormType>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      name: '',
      description: null,
      sku: null,
      barcode: null,
      categoryId: '',
      basePrice: 0,
      baseCost: null,
      isActive: true,
      imageUrls: [],
      customFields: Prisma.JsonNull,
      width: null,
      height: null,
      length: null,
      dimensionUnit: 'cm',
      weight: null,
      weightUnit: 'kg',
      volumetricWeight: null,
      reorderPoint: 5,
      defaultLocationId: null,
      variants: [],
      suppliers: [],
      ...(isEditMode && { productId: product.id }),
    },
  });

  useEffect(() => {
    if (isEditMode && product) {
      form.reset({
        ...product,
        productId: product.id,
        description: product.description ?? null,
        sku: product.sku ?? null,
        barcode: product.barcode ?? null,
        baseCost: product.baseCost ?? null,
        customFields: product.customFields ?? Prisma.JsonNull,
        width: product.width ?? null,
        height: product.height ?? null,
        length: product.length ?? null,
        weight: product.weight ?? null,
        volumetricWeight: product.volumetricWeight ?? null,
        defaultLocationId: product.defaultLocationId ?? null,
        variants:
          product.variants?.map(v => ({
            ...v,
            sku: v.sku ?? null,
            barcode: v.barcode ?? null,
            attributes: v.attributes ?? Prisma.JsonNull,
          })) ?? [],
        suppliers:
          product.suppliers?.map(s => ({
            ...s,
            supplierSku: s.supplierSku ?? null,
            minimumOrderQuantity: s.minimumOrderQuantity ?? null,
            packagingUnit: s.packagingUnit ?? null,
          })) ?? [],
      });
    }
  }, [product, isEditMode, form]);

  const {
    fields: variantFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  const { data: locationsResult, error: locationsError, isLoading: isLoadingLocations } = useLocations();
  const locations = locationsResult?.warehouses || [];
  // const { data: suppliersResult, error: suppliersError, isLoading: isLoadingSuppliers } = useSuppliers();
  // const suppliersList = suppliersResult?.data || [];
  const { data: categoriesResult, error: categoriesError, isLoading: isLoadingCategories } = useCategories();
  const categories = categoriesResult?.data || [];

  const handleImageUpload = useCallback(
    async (files: FileList) => {
      if (!files.length) return;

      const newPreviews = Array.from(files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setPreviewFiles(prev => [...prev, ...newPreviews]);

      setIsUploading(true);
      setGeneralError(null);
      const uploadedUrls: string[] = [];

      try {
        for (const { file } of newPreviews) {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error(`Upload failed for ${file.name}`);

          const data = await response.json();
          if (!data.url) throw new Error(`Invalid response for ${file.name}`);

          uploadedUrls.push(data.url);
          setPreviewFiles(prev => prev.filter(p => p.file !== file));
          URL.revokeObjectURL(newPreviews.find(p => p.file === file)?.preview || '');
        }

        const currentUrls = form.getValues('imageUrls') || [];
        form.setValue('imageUrls', [...currentUrls, ...uploadedUrls], { shouldValidate: true, shouldDirty: true });
        toast.success('Images uploaded successfully!');
      } catch (error) {
        console.error('Image upload failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Image upload failed. Please try again.';
        setGeneralError(errorMessage);
        toast.error(errorMessage);
        newPreviews.forEach(p => URL.revokeObjectURL(p.preview));
        setPreviewFiles(prev => prev.filter(p => !newPreviews.some(np => np.preview === p.preview)));
      } finally {
        setIsUploading(false);
      }
    },
    [form]
  );

  const removeImage = useCallback(
    (urlToRemove: string) => {
      const currentUrls = form.getValues('imageUrls') || [];
      form.setValue(
        'imageUrls',
        currentUrls.filter(url => url !== urlToRemove),
        { shouldValidate: true, shouldDirty: true }
      );
    },
    [form]
  );
const onSubmit = async (data: ProductFormType) => {
  setGeneralError(null);

  startTransition(async () => {
    try {
      const apiUrl = isEditMode ? `/api/products/${product?.id}` : '/api/products';
      const apiMethod = isEditMode ? 'PUT' : 'POST';

      // Prepare the payload
      const payload = {
        ...data,
        // Handle variants and suppliers with optional IDs in edit mode
        variants: data.variants?.map(({ id, ...rest }) => (isEditMode && id ? { id, ...rest } : rest)),
        suppliers: data.suppliers?.map(({ id, ...rest }) => (isEditMode && id ? { id, ...rest } : rest)),
      };

      // Create FormData instance
      const formData = new FormData();

      // Append all simple fields
      for (const [key, value] of Object.entries(payload)) {
        // Skip complex fields that need special handling
        if (key === 'variants' || key === 'suppliers' || key === 'imageUrls' || key === 'customFields') continue;

        // Handle null/undefined values
        if (value === null || value === undefined) {
          formData.append(key, '');
        } else if (typeof value === 'object') {
          // Handle nested objects (like attributes)
          formData.append(key, JSON.stringify(value));
        } else {
          // Convert all other values to string
          formData.append(key, String(value));
        }
      }

      // Handle customFields (Prisma.JsonValue)
      if (payload.customFields && payload.customFields !== Prisma.JsonNull) {
        formData.append('customFields', JSON.stringify(payload.customFields));
      }

      // Handle variants and suppliers as JSON arrays
      formData.append('variants', JSON.stringify(payload.variants || []));
      formData.append('suppliers', JSON.stringify(payload.suppliers || []));

      // Handle image URLs
      if (payload.imageUrls) {
        payload.imageUrls.forEach((url, index) => {
          formData.append(`imageUrls[${index}]`, url);
        });
      }

      // Handle preview files (new uploads)
      if (previewFiles.length > 0) {
        previewFiles.forEach((file, index) => {
          formData.append(`newImages`, file.file);
        });
      }

      // Send the request
      const response = await fetch(apiUrl, {
        method: apiMethod,
        // Don't set Content-Type header - let the browser set it with the correct boundary
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;

        // Handle field-specific errors
        if (errorData.fieldErrors) {
          Object.entries(errorData.fieldErrors).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              form.setError(field as any, {
                type: 'server',
                message: errors.join(', '),
              });
            }
          });
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log(result)
      toast.success(`Product ${isEditMode ? 'updated' : 'added'} successfully!`);
      router.push('/products');
      router.refresh();
    } catch (error: unknown) {
      console.error('Form submission error:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setGeneralError(message);
      toast.error(message);
    }
  });
};

  if (isLoadingCategories || isLoadingLocations) {
    return <Loading />;
  }

  const dataLoadingError = categoriesError || locationsError ;
  if (dataLoadingError) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            Failed to load required data: {dataLoadingError.message}. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleManageVariants = () => {
    setVariantModalOpen(true);
  };

  return (
    <>
      <VariantModal
        open={variantModalOpen}
        onOpenChange={setVariantModalOpen}
        variants={form.watch('variants')}
        onAddVariant={variant => append(variant)}
        onRemoveVariant={index => remove(index)}
      />

      <div className="container mx-auto p-4 space-y-6">
        <SectionHeader
          title={isEditMode ? 'Edit Product' : 'Create New Product'}
          subtitle={
            isEditMode
              ? 'Update the details of this product.'
              : 'Fill in the details to add a new product to your catalog.'
          }
          icon={
            isEditMode ? (
              <Edit className="h-8 w-8 text-primary mt-2" />
            ) : (
              <PackagePlus className="h-8 w-8 text-primary mt-2" />
            )
          }
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {generalError && (
              <Alert variant="destructive">
                <CircleAlert className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-6">
                <Card className="bg-gradient-to-br from-background to-muted/20 shadow-md border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary text-xl flex items-center gap-2">
                      <PackagePlus className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>Enter the core details of the product.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Premium T-Shirt" {...field} className="bg-background/60" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Barcode (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 9876543210"
                              {...field}
                              value={field.value ?? ''}
                              className="bg-background/60"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detailed description of the product..."
                              {...field}
                              value={field.value ?? ''}
                              className="bg-background/60 min-h-[120px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isPending || isLoadingCategories}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-background/60">
                                  {isLoadingCategories ? (
                                    <span className="text-muted-foreground">Loading...</span>
                                  ) : (
                                    <SelectValue placeholder="Select a category" />
                                  )}
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map(category => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
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
                        name="basePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Price *</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                {...field}
                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                className="bg-background/60"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="baseCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Cost (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                {...field}
                                value={field.value ?? ''}
                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                className="bg-background/60"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="defaultLocationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Location (Optional)</FormLabel>
                            <Select
                              value={field.value ?? ''}
                              onValueChange={field.onChange}
                              disabled={isPending || isLoadingLocations}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-background/60">
                                  <SelectValue placeholder="Select a location" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {locations.map(location => (
                                  <SelectItem key={location.id} value={location.id}>
                                    {location.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-background to-muted/20 shadow-md border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary text-xl">Physical Attributes (Optional)</CardTitle>
                    <CardDescription>Specify the physical characteristics.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(['width', 'height', 'length'] as const).map(dim => (
                        <FormField
                          key={dim}
                          control={form.control}
                          name={dim}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="capitalize">{dim}</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0.0"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                  className="bg-background/60"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                {...field}
                                value={field.value ?? ''}
                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                className="bg-background/60"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="weightUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight Unit</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="bg-background/60">
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="g">g</SelectItem>
                                <SelectItem value="lb">lb</SelectItem>
                                <SelectItem value="oz">oz</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="volumetricWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Volumetric Weight</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="0.00"
                              {...field}
                              value={field.value ?? ''}
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                              className="bg-background/60"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-6 space-y-6">
                <Card className="bg-gradient-to-br from-background to-muted/20 shadow-md border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary text-xl">Inventory Settings</CardTitle>
                    <CardDescription>Configure stock and availability.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                              placeholder="e.g., 10"
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                              className="bg-background/60"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-background/30">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Active Product</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Make this product available for sale and visible in listings.
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-background to-muted/20 shadow-md border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary text-xl flex items-center justify-between">
                      <span>Product Variants</span>
                      <Button type="button" variant="outline" onClick={handleManageVariants} className="h-8">
                        Manage Variants
                      </Button>
                    </CardTitle>
                    <CardDescription>Configure different variations (size, color, etc.).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {variantFields.length > 0 ? (
                      <ScrollArea className="h-60">
                        <div className="space-y-2 pr-3">
                          {variantFields.map((field, index) => (
                            <div
                              key={field.id}
                              className="p-3 border rounded bg-background/50 hover:bg-background/80 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <p className="font-medium">
                                  {form.watch(`variants.${index}.name`) || 'Unnamed Variant'}
                                </p>
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground space-y-1">
                                <div className="flex justify-between">
                                  <span>SKU: {form.watch(`variants.${index}.sku`) || 'N/A'}</span>
                                  <span
                                    className={
                                      form.watch(`variants.${index}.isActive`) ? 'text-green-500' : 'text-red-500'
                                    }
                                  >
                                    {form.watch(`variants.${index}.isActive`) ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Price Mod: {form.watch(`variants.${index}.priceModifier`)}</span>
                                  <span>Barcode: {form.watch(`variants.${index}.barcode`) || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>
                                    Reorder: {form.watch(`variants.${index}.reorderPoint`)} /{' '}
                                    {form.watch(`variants.${index}.reorderQty`)}
                                  </span>
                                  <span
                                    className={form.watch(`variants.${index}.lowStockAlert`) ? 'text-amber-500' : ''}
                                  >
                                    {form.watch(`variants.${index}.lowStockAlert`) ? 'Low Stock Alert' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-muted-foreground">No variants defined. The product will use base details.</p>
                        <Button type="button" variant="outline" onClick={handleManageVariants} className="mt-2">
                          Add Variants
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-background to-muted/20 shadow-md border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary text-xl flex items-center gap-2">
                      <ImagePlus className="h-5 w-5" />
                      Product Images
                    </CardTitle>
                    <CardDescription>Upload or drag & drop product images.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="imageUrls"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <>
                              <Input
                                id="imageUploadInput"
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={e => e.target.files && handleImageUpload(e.target.files)}
                                disabled={isUploading || isPending}
                              />
                              <div
                                className={`relative min-h-[250px] border-2 border-dashed rounded-lg ${
                                  isDragging ? 'border-primary bg-primary/10' : 'border-muted'
                                } transition-colors duration-200 flex flex-col`}
                                onDragOver={e => {
                                  e.preventDefault();
                                  setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={e => {
                                  e.preventDefault();
                                  setIsDragging(false);
                                  if (e.dataTransfer.files) handleImageUpload(e.dataTransfer.files);
                                }}
                              >
                                {(field.value?.length ?? 0) > 0 || previewFiles.length > 0 ? (
                                  <div className="p-4 flex-grow">
                                    <div className="flex justify-between items-center mb-2">
                                      <FormLabel className="text-sm font-medium">Uploaded Images</FormLabel>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => document.getElementById('imageUploadInput')?.click()}
                                        disabled={isUploading || isPending}
                                      >
                                        {isUploading ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <ImagePlus className="mr-2 h-4 w-4" />
                                        )}
                                        Add More
                                      </Button>
                                    </div>
                                    <ScrollArea className="h-[180px]">
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pr-3">
                                        {previewFiles.map(item => (
                                          <div key={item.preview} className="relative group aspect-square">
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 rounded-lg">
                                              <Loader2 className="h-6 w-6 animate-spin text-white" />
                                            </div>
                                            <Image
                                              src={item.preview}
                                              alt="Uploading preview"
                                              fill
                                              className="rounded-lg border border-muted object-cover"
                                            />
                                          </div>
                                        ))}
                                        {field.value?.map(url => (
                                          <div key={url} className="relative group aspect-square">
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg z-10">
                                              <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => removeImage(url)}
                                                disabled={isPending}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                            <Image
                                              src={url}
                                              alt="Product Image"
                                              fill
                                              className="rounded-lg border border-muted object-cover"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                ) : (
                                  <label
                                    htmlFor="imageUploadInput"
                                    className="flex flex-col items-center justify-center h-full p-6 cursor-pointer flex-grow"
                                  >
                                    <ImagePlus className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-sm text-muted-foreground text-center mb-2">
                                      {isUploading ? 'Uploading...' : 'Drag & drop images here or click to browse'}
                                    </p>
                                    {!isUploading && (
                                      <Button type="button" variant="outline" disabled={isPending}>
                                        Browse Files
                                      </Button>
                                    )}
                                  </label>
                                )}
                                {isDragging && <DragOverlay />}
                              </div>
                            </>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="sticky bottom-0 -mx-4 -mb-4 mt-8 p-4 bg-background/95 border-t border-border backdrop-blur-sm z-20">
              <div className="container mx-auto flex justify-between items-center">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="min-w-[150px]"
                  disabled={isPending || isUploading || !form.formState.isDirty}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? 'Saving...' : 'Adding...'}
                    </>
                  ) : isEditMode ? (
                    'Save Changes'
                  ) : (
                    'Add Product'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
