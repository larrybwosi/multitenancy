'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { toast } from 'sonner';
import Image from 'next/image';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Icons
import { Trash2, Loader2, CircleAlert, PackagePlus, ImagePlus } from 'lucide-react';

// Types
import { ProductInput, ProductSchema } from '@/lib/validations/product';
import { type InventoryLocation } from '@prisma/client';

// Components and Hooks
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VariantModal } from './variant';
import { useLocations } from '@/lib/hooks/use-supplier';
import { useCategories } from '@/lib/hooks/use-categories';

// Overlay component directly in the file since it's specific to this page
type DragOverlayProps = Record<string, never>;
const DragOverlay: React.FC<DragOverlayProps> = () => {
  return (
    <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
      <div className="bg-background p-4 rounded-lg shadow-lg text-center">
        <p className="text-primary font-medium">Drop images here</p>
        <p className="text-sm text-muted-foreground">Release to upload</p>
      </div>
    </div>
  );
};

export default function AddProductForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [prerequisiteDialogOpen, setPrerequisiteDialogOpen] = useState(false);
  const [missingPrerequisites, setMissingPrerequisites] = useState<{
    categories: boolean;
    warehouses: boolean;
  }>({ categories: false, warehouses: false });
  const [previewFiles, setPreviewFiles] = useState<{file: File, preview: string}[]>([]);

  const form = useForm({
    resolver: zodResolver(ProductSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      barcode: "",
      categoryId: "",
      basePrice: 0,
      isActive: true,
      imageUrls: [],
      width: undefined,
      height: undefined,
      length: undefined,
      dimensionUnit: "cm",
      weight: undefined,
      weightUnit: "kg",
      volumetricWeight: undefined,
      reorderPoint: 10,
      defaultLocationId: "",
      variants: [
        {
          name: "Default",
          reorderPoint: 5,
          reorderQty: 10,
          isActive: true,
          lowStockAlert: true,
          barcode: "",
        },
      ],
      suppliers: [],
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const { data: categoriesResult } = useCategories();
  const { data: { warehouses = [] } = {} } = useLocations(); 

  const categories = categoriesResult?.data || [];
  console.log(categoriesResult);
  console.log(warehouses);
  const locations = warehouses.filter(loc => loc.isActive) as InventoryLocation[];

  // Check if prerequisites are met
  useEffect(() => {
    const noCategories = !categories || categories.length === 0;
    const noWarehouses = !warehouses || warehouses.length === 0;
    
    if (noCategories || noWarehouses) {
      setMissingPrerequisites({
        categories: noCategories,
        warehouses: noWarehouses
      });
      setPrerequisiteDialogOpen(true);
    }
  }, [categories, warehouses]);

  const handleImageUpload = useCallback(async (files: FileList) => {
    if (!files.length) return;
    
    // Create previews first
    const newPreviews = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setPreviewFiles(prev => [...prev, ...newPreviews]);
    
    // Then upload each file
    setIsUploading(true);
    setGeneralError(null);
    
    for (const { file } of newPreviews) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        setImageUrls((prev) => [...prev, data.url]);
        const currentUrls = form.getValues('imageUrls') || [];
        form.setValue('imageUrls', [...currentUrls, data.url]);
      } catch (error) {
        console.error("Image upload failed:", error);
        setGeneralError("Image upload failed. Please try again.");
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    setIsUploading(false);
    if (!generalError) {
      toast.success("Images uploaded successfully!");
    }
  }, [form, generalError]);

  const removePreview = useCallback((previewToRemove: string) => {
    setPreviewFiles(prev => prev.filter(p => p.preview !== previewToRemove));
  }, []);

  const removeImage = useCallback((urlToRemove: string) => {
    setImageUrls((prev) => prev.filter((url) => url !== urlToRemove));
    const currentUrls = form.getValues('imageUrls') || [];
    form.setValue('imageUrls', currentUrls.filter((url: string) => url !== urlToRemove));
  }, [form]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(e.dataTransfer.files);
  }, [handleImageUpload]);

  const handleSubmit = async (values: ProductInput) => {
    setGeneralError(null);

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === "variants" || key === "suppliers" || key === "imageUrls") return;
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    formData.append("variants", JSON.stringify(values.variants));
    formData.append("suppliers", JSON.stringify(values.suppliers));
    imageUrls.forEach((url) => formData.append("imageUrls", url));

    startTransition(async () => {
      try {
        const response = await fetch("/api/products", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        if (result?.error) {
          if (result.fieldErrors) {
            const firstErrorField = Object.keys(result.fieldErrors)[0];
            const element = document.getElementsByName(firstErrorField)[0];
            element?.focus();
            element?.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          setGeneralError(result.error);
          toast.error(result.error || "Failed to add product.");
        } else if (result?.success) {
          toast.success("Product added successfully!");
          router.push("/products");
        } else {
          setGeneralError("An unexpected error occurred.");
          toast.error("An unexpected error occurred.");
        }
      } catch (error) {
        console.error("Form submission error:", error);
        setGeneralError("An unexpected server error occurred.");
        toast.error("An unexpected server error occurred.");
      }
    });
  };

  const variants = form.watch('variants')?.map(variant => ({
    name: variant.name,
    isActive: variant.isActive ?? true,
    reorderPoint: variant.reorderPoint ?? 5,
    reorderQty: variant.reorderQty ?? 10,
    lowStockAlert: variant.lowStockAlert ?? true,
    barcode: variant.barcode,
    id: variant.id,
    attributes: variant.attributes,
  })) || [];

  return (
    <>
      <VariantModal
        open={variantModalOpen}
        onOpenChange={setVariantModalOpen}
        variants={variants}
        onAddVariant={(variant) => appendVariant(variant)}
        onRemoveVariant={removeVariant}
      />
      
      {/* Prerequisites Dialog */}
      <Dialog open={prerequisiteDialogOpen} onOpenChange={setPrerequisiteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Missing Requirements</DialogTitle>
            <DialogDescription>
              Before adding products, you need to set up the following:
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {missingPrerequisites.categories && (
              <Alert className="bg-amber-50 border-amber-200">
                <CircleAlert className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-700">No Categories Available</AlertTitle>
                <AlertDescription className="text-amber-600">
                  You need to create at least one product category before adding products.
                </AlertDescription>
              </Alert>
            )}
            
            {missingPrerequisites.warehouses && (
              <Alert className="bg-amber-50 border-amber-200">
                <CircleAlert className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-700">No Warehouses Available</AlertTitle>
                <AlertDescription className="text-amber-600">
                  You need to set up at least one warehouse location for inventory management.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <Button
              type="button" 
              variant="ghost"
              onClick={() => setPrerequisiteDialogOpen(false)}
            >
              Continue Anyway
            </Button>
            <div className="flex gap-2">
              {missingPrerequisites.categories && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/categories')}
                >
                  Create Categories
                </Button>
              )}
              
              {missingPrerequisites.warehouses && (
                <Button
                  type="button"
                  onClick={() => router.push('/locations')}
                >
                  Set Up Warehouses
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="container mx-auto p-4 space-y-6">
        <SectionHeader
          title="Create New Product"
          subtitle="Fill in the details to add a new product to your catalog."
          icon={<PackagePlus className="h-8 w-8 text-primary mt-2" />}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {generalError && (
              <Alert variant="destructive">
                <CircleAlert className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Basic Information */}
              <div className="lg:col-span-6 space-y-6">
                <Card className="bg-gradient-to-br from-background to-muted/20 shadow-md border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary text-xl flex items-center gap-2">
                      <PackagePlus className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>Enter the core details of your product.</CardDescription>
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
                      <FormField
                        control={form.control}
                        name="barcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barcode/SKU</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., SKU123456" {...field} value={field.value || ""} className="bg-background/60" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detailed description of the product..."
                              {...field}
                              value={field.value || ""}
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
                            <FormControl>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="bg-background/60">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
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
                                type="number" 
                                step="0.01"
                                placeholder="0.00" 
                                {...field} 
                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                className="bg-background/60" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="defaultLocationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Location</FormLabel>
                          <FormControl>
                            <Select 
                              value={field.value} 
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="bg-background/60">
                                <SelectValue placeholder="Select a default location" />
                              </SelectTrigger>
                              <SelectContent>
                                {locations.map((location) => (
                                  <SelectItem key={location.id} value={location.id}>
                                    {location.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              
                {/* Physical Attributes */}
                <Card className="bg-gradient-to-br from-background to-muted/20 shadow-md border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary text-xl">Physical Attributes</CardTitle>
                    <CardDescription>Specify the physical characteristics of your product.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="0.0" 
                                {...field} 
                                value={field.value || ''}
                                onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="bg-background/60" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="0.0" 
                                {...field} 
                                value={field.value || ''}
                                onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="bg-background/60" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="0.0" 
                                {...field} 
                                value={field.value || ''}
                                onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                        name="dimensionUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dimension Unit</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="bg-background/60">
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cm">Centimeters (cm)</SelectItem>
                                  <SelectItem value="m">Meters (m)</SelectItem>
                                  <SelectItem value="in">Inches (in)</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.0" 
                                {...field} 
                                value={field.value || ''}
                                onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                        name="weightUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight Unit</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="bg-background/60">
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                  <SelectItem value="g">Grams (g)</SelectItem>
                                  <SelectItem value="lb">Pounds (lb)</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="volumetricWeight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Volumetric Weight</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.0" 
                                {...field} 
                                value={field.value || ''}
                                onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="bg-background/60" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column - Inventory and Variants */}
              <div className="lg:col-span-6 space-y-6">
                {/* Inventory Settings */}
                <Card className="bg-gradient-to-br from-background to-muted/20 shadow-md border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary text-xl">Inventory Settings</CardTitle>
                    <CardDescription>Configure inventory management options.</CardDescription>
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
                              placeholder="10" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
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
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Active Product</FormLabel>
                            <p className="text-sm text-muted-foreground">This product will be available for sale.</p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                
                {/* Variants */}
                <Card className="bg-gradient-to-br from-background to-muted/20 shadow-md border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary text-xl flex items-center justify-between">
                      <span>Product Variants</span>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setVariantModalOpen(true)}
                        className="h-8"
                      >
                        Manage Variants
                      </Button>
                    </CardTitle>
                    <CardDescription>Configure different variations of your product.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {variantFields.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-auto">
                        {variantFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="p-3 border rounded bg-background/50 hover:bg-background/80 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <p className="font-medium">{field.name || 'Unnamed Variant'}</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeVariant(index)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              <div className="flex justify-between">
                                <span>Barcode: {field.barcode || 'N/A'}</span>
                                <span className={field.isActive ? 'text-green-500' : 'text-red-500'}>
                                  {field.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Reorder: {field.reorderPoint} / {field.reorderQty}</span>
                                <span className={field.lowStockAlert ? 'text-amber-500' : 'text-muted-foreground'}>
                                  {field.lowStockAlert ? 'Low Stock Alert On' : 'No Alerts'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-muted-foreground">No variants defined.</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setVariantModalOpen(true)}
                          className="mt-2"
                        >
                          Add Your First Variant
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Product Images */}
                <Card className="bg-gradient-to-br from-background to-muted/20 shadow-md border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary text-xl flex items-center gap-2">
                      <ImagePlus className="h-5 w-5" />
                      Product Images
                    </CardTitle>
                    <CardDescription>Upload or drag & drop product images here.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`relative min-h-[300px] border-2 border-dashed rounded-lg ${
                        isDragging ? 'border-primary bg-primary/10' : 'border-muted'
                      } transition-colors duration-200`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                    >
                      {previewFiles.length === 0 && imageUrls.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-6">
                          <ImagePlus className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-sm text-muted-foreground text-center mb-2">
                            Drag & drop your images here or click to browse
                          </p>
                          <Input
                            id="imageUpload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                            disabled={isUploading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('imageUpload')?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              'Browse Images'
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-medium">Product Images</p>
                            <Input
                              id="additionalImageUpload"
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                              disabled={isUploading}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('additionalImageUpload')?.click()}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                'Add More'
                              )}
                            </Button>
                          </div>
                          
                          <ScrollArea className="h-[220px]">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {/* Preview Files (not yet uploaded) */}
                              {previewFiles.map((item) => (
                                <div key={item.preview} className="relative group aspect-square">
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg z-10">
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => removePreview(item.preview)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="h-full w-full rounded-lg overflow-hidden border border-muted">
                                    <Image
                                      src={item.preview}
                                      alt="Preview"
                                      width={150}
                                      height={150}
                                      className="h-full w-full object-cover"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                                      Uploading...
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Uploaded Files */}
                              {imageUrls.map((url) => (
                                <div key={url} className="relative group aspect-square">
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg z-10">
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => removeImage(url)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="h-full w-full rounded-lg overflow-hidden border border-muted">
                                    <Image
                                      src={url}
                                      alt="Product Image"
                                      width={150}
                                      height={150}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                      {isDragging && <DragOverlay />}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="sticky bottom-4 bg-background/95 p-4 rounded-lg shadow-lg backdrop-blur-md border border-muted">
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/products')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="min-w-[150px]"
                  disabled={isPending || isUploading}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Product...
                    </>
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