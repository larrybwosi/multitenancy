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
import {
  Trash2,
  Loader2,
  CircleAlert,
  Edit,
  ImagePlus,
  Package,
  ShoppingBag,
  Boxes,
  PlusCircle,
  Settings2,
} from 'lucide-react'; 
import Image from 'next/image'; 
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useCategories } from '@/lib/hooks/use-categories';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DragOverlay } from '@/components/ui/drag-overlay';
import { Checkbox } from '@/components/ui/checkbox';
import { Prisma } from '@/prisma/client';
import Loading from './loading';

import { z } from 'zod';
import { ProductVariantModal } from './variant-modal';
import { useLocations } from '@/hooks/use-warehouse';
import { EditProductSchema, ProductSupplierSchema, ProductVariantSchema } from '@/lib/validations/product';

export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;

export type ProductSupplierInput = z.infer<typeof ProductSupplierSchema>;
export type EditProductSchemaType = z.infer<typeof EditProductSchema>;


export type ProductForEditing = Omit<EditProductSchemaType, 'variants' | 'suppliers'> & {
  id: string;
  // Additional fields that might be in the database but not in the schema
  sellingUnit?: string | null;
  restockUnit?: string | null;
  itemsPerUnit?: number | null;
  reorderPoint?: number;
  // Define variants and suppliers with proper types
  variants: Array<{
    id?: string;
    name: string;
    buyingPrice: number;
    isActive: boolean;
    reorderPoint: number;
    reorderQty: number;
    lowStockAlert: boolean;
    sku?: string | null;
    barcode?: string | null;
    retailPrice?: number | null;
    wholesalePrice?: number | null;
    attributes?: Record<string, unknown> | null;
    weight?: number | null;
    weightUnit?: string;
  }>;
  suppliers: Array<{
    id?: string;
    supplierSku?: string | null;
    supplierId: string;
    costPrice: number;
    isPreferred: boolean;
    minimumOrderQuantity?: number | null;
    packagingUnit?: string | null;
  }>;
};

interface EditProductFormProps {
  product: ProductForEditing;
}

export default function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<
    (ProductVariantInput & { id?: string | null; index?: number }) | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{ file: File; preview: string }[]>([]);

  const form = useForm<EditProductSchemaType>({
    resolver: zodResolver(EditProductSchema),
    defaultValues: {
      productId: product.id,
      name: product.name || '',
      description: product.description ?? null,
      sku: product.sku,
      barcode: product.barcode ?? undefined,
      categoryId: product.categoryId || '',
      buyingPrice: product.buyingPrice || 0,
      retailPrice: product.retailPrice ?? undefined,
      wholesalePrice: product.wholesalePrice ?? undefined,
      isActive: product.isActive !== undefined ? product.isActive : true,
      imageUrls: product.imageUrls || [],
      customFields: product.customFields ?? Prisma.JsonNull,
      width: product.width ?? undefined,
      height: product.height ?? undefined,
      length: product.length ?? undefined,
      dimensionUnit: product.dimensionUnit ?? 'CENTIMETER',
      weight: product.weight ?? undefined,
      weightUnit: product.weightUnit ?? 'WEIGHT_KG',
      volumetricWeight: product.volumetricWeight ?? undefined,
      defaultLocationId: product.defaultLocationId ?? undefined,
      restockUnit: product.restockUnit ?? undefined,
      itemsPerUnit: product.itemsPerUnit ?? undefined,
      sellingUnit: product.sellingUnit ?? undefined,
      variants:
        product.variants?.map(v => ({
          ...v,
          id: v.id,
          sku: v.sku ?? undefined,
          barcode: v.barcode ?? undefined,
          attributes: v.attributes ?? Prisma.JsonNull,
          weight: v.weight ?? undefined,
          weightUnit: v.weightUnit ?? 'WEIGHT_KG',
        })) ?? [],
      suppliers:
        product.suppliers?.map(s => ({
          // 2, 26]
          ...s,
          id: s.id,
          supplierSku: s.supplierSku ?? undefined,
          // minimumOrderQuantity: s.minimumOrderQuantity ?? null, (Example if you have this)
          // packagingUnit: s.packagingUnit ?? null, (Example if you have this)
        })) ?? [],
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        ...product,
        productId: product.id,
        description: product.description ?? undefined,
        sku: product.sku ?? undefined,
        barcode: product.barcode ?? undefined, 
        buyingPrice: product.buyingPrice ?? 0, // Or handle as per schema
        wholesalePrice: product.wholesalePrice ?? undefined,
        retailPrice: product.retailPrice ?? undefined,
        customFields: product.customFields ?? Prisma.JsonNull,
        width: product.width ?? undefined,
        height: product.height ?? undefined,
        length: product.length ?? undefined,
        dimensionUnit: product.dimensionUnit ?? 'CENTIMETER',
        weight: product.weight ?? undefined,
        weightUnit: product.weightUnit ?? 'WEIGHT_KG',
        volumetricWeight: product.volumetricWeight ?? undefined,
        defaultLocationId: product.defaultLocationId ?? undefined,
        restockUnit: product.restockUnit ?? undefined,
        itemsPerUnit: product.itemsPerUnit ?? undefined,
        sellingUnit: product.sellingUnit ?? undefined,
        variants:
          product.variants?.map(v => ({
           
            ...v,
            id: v.id ?? undefined,
            sku: v.sku ?? undefined,
            barcode: v.barcode ?? undefined,
            attributes: v.attributes ?? Prisma.JsonNull,
            weight: v.weight ?? undefined, // Using undefined for optional fields 
            weightUnit: v.weightUnit ?? 'WEIGHT_KG', // Set default value
          })) ?? [],
        suppliers:
          product.suppliers?.map(s => ({
           
            ...s,
            id: s.id ?? undefined,
            supplierSku: s.supplierSku ?? undefined,
          })) ?? [],
      });
      if (product.imageUrls) {
       
        form.setValue('imageUrls', product.imageUrls);
      }
    }
  }, [product, form]);

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
    update: updateVariant,
  } = useFieldArray({
   
    control: form.control,
    name: 'variants',
  });

  const { data: locationsResult, error: locationsError, isLoading: isLoadingLocations } = useLocations();
  const locations = locationsResult?.warehouses || [];
  const { data: categoriesResult, error: categoriesError, isLoading: isLoadingCategories } = useCategories(); 
  const categories = categoriesResult?.data || []; 

  const handleImageUpload = useCallback(
   
    async (files: FileList) => {
      if (!files.length) return;
      const newPreviews = Array.from(files).map(file => ({ file, preview: URL.createObjectURL(file) }));
      setPreviewFiles(prev => [...prev, ...newPreviews]);
      setIsUploading(true);
      setGeneralError(null);

      const uploadedUrls: string[] = [];
      try {
       
        for (const { file } of newPreviews) {
         
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch('/api/upload', { method: 'POST', body: formData });
          if (!response.ok) throw new Error(`Upload failed for ${file.name}. Status: ${response.status}`);
          const data = await response.json();
          if (!data.url) throw new Error(`Invalid response for ${file.name}`);
          uploadedUrls.push(data.url);
        }
        const currentUrls = form.getValues('imageUrls') || [];
        form.setValue('imageUrls', [...currentUrls, ...uploadedUrls], { shouldValidate: true, shouldDirty: true });
        toast.success('Images uploaded successfully!');
      } catch (error) {
       
        const errorMessage = error instanceof Error ? error.message : 'Image upload failed. Please try again.';
        setGeneralError(errorMessage);
        toast.error(errorMessage);
      } finally {
       
        newPreviews.forEach(p => URL.revokeObjectURL(p.preview));
        setPreviewFiles(prev => prev.filter(p => !newPreviews.some(np => np.preview === p.preview)));
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
      toast.info('Image marked for removal. Save changes to confirm.');
    },
    [form]
  );

  const handleOpenVariantModal = (variantToEdit?: ProductVariantInput & { id?: string | null; index?: number }) => {
    
    setEditingVariant(variantToEdit || null); 
    setVariantModalOpen(true);
  };

  const handleSaveVariant = (variantData: ProductVariantInput, index?: number) => {
   
    if (index !== undefined && editingVariant) {
     
      // Make sure to convert types correctly if needed
      const typedVariantData = {
        ...variantData,
        // Set any additional properties needed
      };
      updateVariant(index, typedVariantData);
      toast.success('Variant updated successfully.');
    } else {
     
      // Make sure to convert types correctly if needed
      const typedVariantData = {
        ...variantData,
        // Set any additional properties needed
      };
      appendVariant(typedVariantData);
      toast.success('New variant added successfully.');
    }
    setVariantModalOpen(false);
    setEditingVariant(null);
  };

  const onSubmit = async (data: EditProductSchemaType) => {
   
    setGeneralError(null);
    startTransition(async () => {
     
      try {
       
        const apiUrl = `/api/products/${product.id}`;
        const apiMethod = 'PUT';

        const payload = {
         
          ...data,
          variants: data.variants?.map(({ id, ...rest }) => {
           
            // Ensure `id` is only included if it's a valid CUID (for existing variants)
            // New variants might not have an ID or it might be null/undefined
            const existingProdVariant = product.variants.find(v => v.id === id);
            if (id && existingProdVariant) {
              return { id, ...rest };
            }
            const { ...newRest } = rest; 
            return newRest; // For new variants, send without ID or with null ID if schema allows
          }),
          suppliers: data.suppliers?.map(({ id, ...rest }) => {
           
            return id && product.suppliers.find(s => s.id === id) ? { id, ...rest } : rest;
          }),
        };

        const response = await fetch(apiUrl, {
         
          method: apiMethod,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
         
          const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
          const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
          if (errorData.fieldErrors) {
           
            Object.entries(errorData.fieldErrors).forEach(([field, errors]) => {
             
              if (Array.isArray(errors)) {
               
                // Cast as any is necessary here since we don't know the exact field type
                form.setError(field as keyof typeof form.formState.errors, { type: 'server', message: errors.join(', ') });
              }
            });
          } 
          throw new Error(errorMessage); 
        }

        await response.json();
        toast.success('Product updated successfully!');
        router.push('/products');
        router.refresh();
      } catch (error: unknown) {
       
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        setGeneralError(message);
        toast.error(message);
      }
    });
  };

  if (isLoadingCategories || isLoadingLocations) {
   
    return <Loading />;
  }

  const dataLoadingError = categoriesError || locationsError;
  if (dataLoadingError) {
   
    return (
     
      <div className="container mx-auto p-4">
        {' '}
        
        <Alert variant="destructive">
          {' '}
          
          <CircleAlert className="h-4 w-4" /> 
          <AlertTitle>Error Loading Data</AlertTitle> 
          <AlertDescription>
            {' '}
            
            Failed to load required data: {dataLoadingError.message}. Please try refreshing the page. 
          </AlertDescription>{' '}
          
        </Alert>{' '}
        
      </div>
    );
  }

  return (
    <>
      {' '}
      
      <ProductVariantModal
        // Re-keying the modal can help reset its internal state when `editingVariant` changes significantly
        key={editingVariant ? `edit-${editingVariant.id || JSON.stringify(editingVariant.name)}` : 'add-new-variant'}
        open={variantModalOpen}
        onOpenChange={setVariantModalOpen}
        productName={form.getValues('name')}
        variant={editingVariant}
        onSave={handleSaveVariant}
      />
      <div className="container mx-auto p-6 sm:p-8 space-y-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white min-h-screen">
        {' '}
        
        <SectionHeader
          title="Edit Product"
          subtitle={`Manage details, images, and variations for "${product.name}"`}
          icon={<Edit className="h-8 w-8 text-sky-400 mt-1" />} 
        />
        <Form {...form}>
          {' '}
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            {' '}
            
            {generalError && ( 
              <Alert variant="destructive" className="bg-red-700/20 border-red-500 text-red-300">
                {' '}
                
                <CircleAlert className="h-4 w-4 text-red-400" /> 
                <AlertTitle className="text-red-300">Error</AlertTitle> 
                <AlertDescription>{generalError}</AlertDescription> 
              </Alert> 
            )}{' '}
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {' '}
              
               {/*Left Column */}
              <div className="lg:col-span-7 space-y-8">
                {' '}
                
                <Card className="bg-slate-800/70 border-slate-700 shadow-xl transition-all hover:shadow-sky-500/20">
                  {' '}
                  
                  <CardHeader className="pb-3 border-b border-slate-700">
                    {' '}
                    
                    <CardTitle className="text-sky-400 text-xl flex items-center gap-2">
                      {' '}
                      
                      <Package className="h-5 w-5" /> 
                      Core Product Information
                    </CardTitle>{' '}
                    
                    <CardDescription className="text-slate-400">
                      {' '}
                      
                      This is the main information about your product that customers will see.
                    </CardDescription>{' '}
                    
                  </CardHeader>{' '}
                  
                  <CardContent className="space-y-6 pt-6">
                    {' '}
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={(
                        { field }
                      ) => (
                        <FormItem>
                          {' '}
                          
                          <FormLabel className="text-slate-300">Product Name *</FormLabel> 
                          <FormControl>
                            {' '}
                            
                            <Input
                              placeholder="e.g., Aurora Glow Serum"
                              {...field}
                              className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                            />
                          </FormControl>{' '}
                          
                          <FormDescription className="text-slate-500">
                            The primary display name of the product.
                          </FormDescription>
                          <FormMessage className="text-red-400" /> 
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={(
                        { field }
                      ) => (
                        <FormItem>
                          {' '}
                          
                          <FormLabel className="text-slate-300">Description</FormLabel> 
                          <FormControl>
                            {' '}
                            
                            <Textarea
                              placeholder="Detailed description of the product benefits, ingredients, and usage..." 
                              {...field} 
                              value={field.value ?? ''} 
                              className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100 min-h-[120px] resize-y"
                            />
                          </FormControl>{' '}
                          
                          <FormDescription className="text-slate-500">
                            A compelling summary of your product. Use this space to highlight key features and benefits.
                          </FormDescription>
                          <FormMessage className="text-red-400" /> 
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {' '}
                      
                      <FormField
                        control={form.control}
                        name="sku"
                        render={(
                          { field }
                        ) => (
                          <FormItem>
                            {' '}
                            
                            <FormLabel className="text-slate-300">SKU (Stock Keeping Unit) *</FormLabel>{' '}
                            
                            <FormControl>
                              {' '}
                              
                              <Input
                                placeholder="e.g., AGS-30ML"
                                {...field}
                                value={field.value ?? ''}
                                className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                              />
                            </FormControl>{' '}
                            
                            <FormDescription className="text-slate-500">
                              Unique identifier for this product. Required for inventory tracking.
                            </FormDescription>
                            <FormMessage className="text-red-400" /> 
                          </FormItem>
                        )}
                      />{' '}
                      
                      <FormField
                        control={form.control}
                        name="barcode"
                        render={(
                          { field }
                        ) => (
                          <FormItem>
                            {' '}
                            
                            <FormLabel className="text-slate-300">Barcode (GTIN, UPC, EAN)</FormLabel>{' '}
                            
                            <FormControl>
                              {' '}
                              
                              <Input
                                placeholder="e.g., 9876543210123" 
                                {...field} 
                                value={field.value ?? ''}
                                className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                              />
                            </FormControl>{' '}
                            
                            <FormDescription className="text-slate-500">
                              Product&apos;s global trade item number, if available.
                            </FormDescription>
                            <FormMessage className="text-red-400" /> 
                          </FormItem>
                        )}
                      />
                    </div>{' '}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {' '}
                      
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={(
                          { field }
                        ) => (
                          <FormItem>
                            {' '}
                            
                            <FormLabel className="text-slate-300">Category *</FormLabel> 
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isPending || isLoadingCategories}
                            >
                              <FormControl>
                                {' '}
                                
                                <SelectTrigger className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100">
                                  {' '}
                                  
                                  {isLoadingCategories ? (
                                    <span className="text-slate-400">Loading categories...</span>
                                  ) : (
                                   
                                    <SelectValue placeholder="Select a category" /> 
                                  )}
                                </SelectTrigger>{' '}
                                
                              </FormControl>{' '}
                              
                              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                {' '}
                                
                                {categories.map(
                                  (
                                    category
                                  ) => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.id}
                                      className="hover:bg-slate-700 focus:bg-slate-700"
                                    >
                                      {category.name} 
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>{' '}
                              
                            </Select>{' '}
                            
                            <FormDescription className="text-slate-500">
                              Assign the product to a relevant category for organization.
                            </FormDescription>
                            <FormMessage className="text-red-400" /> 
                          </FormItem>
                        )}
                      />{' '}
                      
                      <FormField
                        control={form.control}
                        name="buyingPrice" // This should be 'buyingPrice' from your BaseProductSchema
                        render={(
                          { field }
                        ) => (
                          <FormItem>
                            {' '}
                            
                            <FormLabel className="text-slate-300">Buying Price (Cost) *</FormLabel> 
                            <FormControl>
                              {' '}
                              
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                {...field}
                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100" // 00]
                              />
                            </FormControl>{' '}
                             
                            <FormDescription className="text-slate-500">
                              The cost to acquire one unit of this product from your supplier.
                            </FormDescription>
                            <FormMessage className="text-red-400" />  
                          </FormItem> // 01]
                        )} // 01]
                      />
                    </div>{' '}
                     
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="retailPrice" // This should be 'retailPrice'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Base Retail Price</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                {...field}
                                value={field.value ?? ''}
                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                              />
                            </FormControl>
                            <FormDescription className="text-slate-500">
                              The standard selling price to customers before any variant adjustments.
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="wholesalePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Wholesale Price</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                {...field}
                                value={field.value ?? ''}
                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                              />
                            </FormControl>
                            <FormDescription className="text-slate-500">
                              Price for bulk or wholesale customers, if applicable.
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>{' '}
                   
                </Card>{' '}
                 
                <Card className="bg-slate-800/70 border-slate-700 shadow-xl transition-all hover:shadow-sky-500/20">
                  {' '}
                   
                  <CardHeader className="pb-3 border-b border-slate-700">
                    {' '}
                     
                    <CardTitle className="text-sky-400 text-xl flex items-center gap-2">
                      {' '}
                       
                      <ShoppingBag className="h-5 w-5" />  
                      Units & Purchasing
                    </CardTitle>{' '}
                     
                    <CardDescription className="text-slate-400">
                      {' '}
                       
                      Configure how this product is typically bought from suppliers and sold to customers.{' '}
                       
                    </CardDescription>{' '}
                     
                  </CardHeader>{' '}
                   
                  <CardContent className="space-y-6 pt-6">
                    {' '}
                     
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {' '}
                       
                      <FormField
                        control={form.control}
                        name="sellingUnit"
                        render={(
                          { field }
                        ) => (
                          <FormItem>
                            {' '}
                             
                            <FormLabel className="text-slate-300">Selling Unit</FormLabel>  
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                              {' '}
                               
                              <FormControl>
                                {' '}
                                 
                                <SelectTrigger className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100">
                                  {' '}
                                   
                                  <SelectValue placeholder="e.g., Piece, Pack, Bottle" />  
                                </SelectTrigger>{' '}
                                 
                              </FormControl>{' '}
                               
                              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                {' '}
                                 
                                <SelectItem value="piece" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Piece
                                </SelectItem>{' '}
                                 
                                <SelectItem value="pack" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Pack
                                </SelectItem>{' '}
                                 
                                <SelectItem value="set" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Set
                                </SelectItem>{' '}
                                 
                                <SelectItem value="kg" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Kilogram (kg)
                                </SelectItem>{' '}
                                 
                                <SelectItem value="g" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Gram (g)
                                </SelectItem>{' '}
                                 
                                <SelectItem value="litre" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Litre (L)
                                </SelectItem>{' '}
                                 
                                <SelectItem value="ml" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Millilitre (ml)
                                </SelectItem>{' '}
                                 
                                <SelectItem value="bottle" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Bottle
                                </SelectItem>
                                <SelectItem value="box" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Box
                                </SelectItem>
                                <SelectItem value="item" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Item
                                </SelectItem>
                              </SelectContent>{' '}
                               
                            </Select>{' '}
                             
                            <FormDescription className="text-slate-500">
                              {' '}
                               
                              The unit in which this product is sold to customers (e.g., "Piece", "Bottle", "kg").{' '}
                               
                            </FormDescription>{' '}
                             
                            <FormMessage className="text-red-400" />  
                          </FormItem> // 25]
                        )} // 25]
                      />{' '}
                       
                      <FormField
                        control={form.control} // 26]
                        name="restockUnit" // 27]
                        render={(
                          { field } // 27]
                        ) => (
                          <FormItem>
                            {' '}
                             
                            <FormLabel className="text-slate-300">Restock Unit</FormLabel>  
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                              {' '}
                               
                              <FormControl>
                                {' '}
                                 
                                <SelectTrigger className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100">
                                  {' '}
                                   
                                  <SelectValue placeholder="e.g., Case, Box, Pallet" />  
                                </SelectTrigger>{' '}
                                 
                              </FormControl>{' '}
                               
                              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                {' '}
                                 
                                <SelectItem value="case" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Case
                                </SelectItem>{' '}
                                 
                                <SelectItem value="box" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Box
                                </SelectItem>{' '}
                                 
                                <SelectItem value="pallet" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Pallet
                                </SelectItem>{' '}
                                 
                                <SelectItem value="unit" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Unit (same as selling)
                                </SelectItem>{' '}
                                 
                                <SelectItem value="carton" className="hover:bg-slate-700 focus:bg-slate-700">
                                  Carton
                                </SelectItem>
                              </SelectContent>{' '}
                               
                            </Select>{' '}
                             
                            <FormDescription className="text-slate-500">
                              {' '}
                               
                              The unit used when purchasing or restocking from suppliers (e.g., "Case of 12").{' '}
                               
                            </FormDescription>{' '}
                             
                            <FormMessage className="text-red-400" />  
                          </FormItem> // 36]
                        )} // 36]
                      />{' '}
                       
                    </div>{' '}
                     
                    <FormField
                      control={form.control} 
                      name="itemsPerUnit" 
                      render={(
                        { field } 
                      ) => (
                        <FormItem>
                          {' '}
                           
                          <FormLabel className="text-slate-300">Items per Restock Unit</FormLabel>  
                          <FormControl>
                            {' '}
                             
                            <Input
                              type="number"
                              inputMode="numeric"
                              step="1" 
                              placeholder="e.g., 12 (if a case contains 12 selling units)" 
                              {...field} 
                              value={field.value ?? ''} // 41]
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} // 41]
                              className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100" // 41]
                            />
                          </FormControl>{' '}
                           
                          <FormDescription className="text-slate-500">
                            {' '}
                             
                            Number of individual selling units contained in one restock unit. (e.g., if selling unit is
                            "Bottle" and restock unit is "Case", this could be 6, 12, 24).  
                          </FormDescription>{' '}
                           
                          <FormMessage className="text-red-400" />  
                        </FormItem> // 44]
                      )} // 44]
                    />{' '}
                     
                  </CardContent>{' '}
                   
                </Card>{' '}
                 
                <Card className="bg-slate-800/70 border-slate-700 shadow-xl transition-all hover:shadow-sky-500/20">
                  {' '}
                   
                  <CardHeader className="pb-3 border-b border-slate-700">
                    {' '}
                     
                    <CardTitle className="text-sky-400 text-xl flex items-center gap-2">
                      {' '}
                       
                      <Boxes className="h-5 w-5" />  
                      Physical & Inventory
                    </CardTitle>{' '}
                     
                    <CardDescription className="text-slate-400">
                      {' '}
                       
                      Details about the product's dimensions, weight, and stock management settings.
                    </CardDescription>{' '}
                     
                  </CardHeader>{' '}
                   
                  <CardContent className="space-y-6 pt-6">
                    {' '}
                     
                    <FormDescription className="text-slate-400 !mt-0">
                      Enter dimensions for shipping calculations and display. These apply to the base product; variants
                      can override if needed.
                    </FormDescription>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                      {' '}
                       
                      {(['width', 'height', 'length'] as const).map(
                        (
                          dim // 48]
                        ) => (
                          <FormField
                            key={dim} // 48]
                            control={form.control} // 48]
                            name={dim} // 49]
                            render={(
                              { field } // 49]
                            ) => (
                              <FormItem>
                                {' '}
                                 
                                <FormLabel className="capitalize text-slate-300">{dim}</FormLabel>  
                                <FormControl>
                                  {' '}
                                   
                                  <Input
                                    type="text" // 50]
                                    inputMode="decimal" // 51]
                                    placeholder="0.0" // 51]
                                    {...field} // 51]
                                    value={field.value ?? ''} // 52]
                                    onChange={e =>
                                      field.onChange(e.target.value === '' ? null : Number(e.target.value))
                                    } // 53]
                                    className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100" // 53]
                                  />
                                </FormControl>{' '}
                                 
                                <FormMessage className="text-red-400" />  
                              </FormItem> // 55]
                            )} // 55]
                          /> // 55]
                        )
                      )}
                      <FormField
                        control={form.control} // 56]
                        name="dimensionUnit" // 56]
                        render={(
                          { field } // 56]
                        ) => (
                          <FormItem>
                            {' '}
                             
                            <FormLabel className="text-slate-300">Unit</FormLabel>  
                            <Select value={field.value ?? 'CENTIMETER'} onValueChange={field.onChange}>
                              {' '}
                               
                              <FormControl>
                                {' '}
                                 
                                <SelectTrigger className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100">
                                  {' '}
                                   
                                  <SelectValue placeholder="Unit" />  
                                </SelectTrigger>{' '}
                                 
                              </FormControl>{' '}
                               
                              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                {' '}
                                 
                                <SelectItem value="CENTIMETER" className="hover:bg-slate-700 focus:bg-slate-700">
                                  cm
                                </SelectItem>{' '}
                                 
                                <SelectItem value="METER" className="hover:bg-slate-700 focus:bg-slate-700">
                                  m
                                </SelectItem>{' '}
                                 
                                <SelectItem value="MILLIMETER" className="hover:bg-slate-700 focus:bg-slate-700">
                                  mm
                                </SelectItem>
                                <SelectItem value="INCH" className="hover:bg-slate-700 focus:bg-slate-700">
                                  in
                                </SelectItem>{' '}
                                 
                                <SelectItem value="FOOT" className="hover:bg-slate-700 focus:bg-slate-700">
                                  ft
                                </SelectItem>{' '}
                                 
                                <SelectItem value="YARD" className="hover:bg-slate-700 focus:bg-slate-700">
                                  yd
                                </SelectItem>
                              </SelectContent>{' '}
                               
                            </Select>{' '}
                             
                            <FormMessage className="text-red-400" />  
                          </FormItem> // 64]
                        )} // 64]
                      />{' '}
                       
                    </div>{' '}
                     
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                      {' '}
                       
                      <FormField
                        control={form.control} // 66]
                        name="weight" // 66]
                        render={(
                          { field } // 66]
                        ) => (
                          <FormItem>
                            {' '}
                             
                            <FormLabel className="text-slate-300">Weight</FormLabel>  
                            <FormControl>
                              {' '}
                               
                              <Input
                                type="text" // 68]
                                inputMode="decimal" // 68]
                                placeholder="0.00" // 68]
                                {...field} // 69]
                                value={field.value ?? ''} // 69]
                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} // 70]
                                className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100" // 70]
                              />
                            </FormControl>{' '}
                             
                            <FormDescription className="text-slate-500">Weight of the base product.</FormDescription>
                            <FormMessage className="text-red-400" />  
                          </FormItem> // 71]
                        )} // 72]
                      />{' '}
                       
                      <FormField
                        control={form.control} // 72]
                        name="weightUnit" // 73]
                        render={(
                          { field } // 73]
                        ) => (
                          <FormItem>
                            {' '}
                             
                            <FormLabel className="text-slate-300">Weight Unit</FormLabel>  
                            <Select value={field.value ?? 'WEIGHT_KG'} onValueChange={field.onChange}>
                              {' '}
                               
                              <FormControl>
                                {' '}
                                 
                                <SelectTrigger className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100">
                                  {' '}
                                   
                                  <SelectValue placeholder="Select unit" />  
                                </SelectTrigger>{' '}
                                 
                              </FormControl>{' '}
                               
                              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                {' '}
                                 
                                <SelectItem value="WEIGHT_KG" className="hover:bg-slate-700 focus:bg-slate-700">
                                  kg
                                </SelectItem>{' '}
                                 
                                <SelectItem value="WEIGHT_G" className="hover:bg-slate-700 focus:bg-slate-700">
                                  g
                                </SelectItem>{' '}
                                 
                                <SelectItem value="WEIGHT_LB" className="hover:bg-slate-700 focus:bg-slate-700">
                                  lb
                                </SelectItem>{' '}
                                 
                                <SelectItem value="WEIGHT_OZ" className="hover:bg-slate-700 focus:bg-slate-700">
                                  oz
                                </SelectItem>{' '}
                                 
                              </SelectContent>{' '}
                               
                            </Select>{' '}
                             
                            <FormMessage className="text-red-400" />  
                          </FormItem> // 81]
                        )} // 81]
                      />{' '}
                       
                    </div>{' '}
                     
                    <FormField
                      control={form.control} // 82]
                      name="volumetricWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Volumetric Weight (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="e.g., 2.5 (calculated based on dimensions and carrier formula)"
                              {...field}
                              value={field.value ?? ''}
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                              className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                            />
                          </FormControl>
                          <FormDescription className="text-slate-500">
                            If different from actual weight, used by some carriers for shipping cost calculation.
                            Typically in kg or lb.
                          </FormDescription>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control} // 82]
                      name="reorderPoint" // 82]
                      render={(
                        { field } // 82]
                      ) => (
                        <FormItem>
                          {' '}
                           
                          <FormLabel className="text-slate-300">Reorder Point</FormLabel>  
                          <FormControl>
                            {' '}
                             
                            <Input
                              type="number" // 84]
                              step="1" // 84]
                              placeholder="e.g., 10" // 84]
                              {...field} // 85]
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} // 85]
                              className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100" // 85]
                            />
                          </FormControl>{' '}
                           
                          <FormDescription className="text-slate-500">
                            {' '}
                             
                            Low stock quantity threshold that should trigger a reorder alert or action.{' '}
                             
                          </FormDescription>{' '}
                           
                          <FormMessage className="text-red-400" />  
                        </FormItem> // 87]
                      )} // 87]
                    />
                    <FormField
                      control={form.control} // 88]
                      name="defaultLocationId" // 88]
                      render={(
                        { field } // 88]
                      ) => (
                        <FormItem>
                          {' '}
                           
                          <FormLabel className="text-slate-300">Default Warehouse Location</FormLabel>{' '}
                           
                          <Select
                            value={field.value ?? ''} // 89]
                            onValueChange={field.onChange} // 90]
                            disabled={isPending || isLoadingLocations} // 90]
                          >
                            <FormControl>
                              {' '}
                               
                              <SelectTrigger className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100">
                                {' '}
                                 
                                <SelectValue placeholder="Select a default storage location" />  
                              </SelectTrigger>{' '}
                               
                            </FormControl>{' '}
                             
                            <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                              {' '}
                               
                              <SelectItem value="" className="hover:bg-slate-700 focus:bg-slate-700">
                                <em>None / Not Specified</em>
                              </SelectItem>
                              {locations.map(
                                (
                                  location // 92]
                                ) => (
                                  <SelectItem
                                    key={location.id} // 93]
                                    value={location.id} // 93]
                                    className="hover:bg-slate-700 focus:bg-slate-700" // 94]
                                  >
                                    {location.name}  
                                  </SelectItem> // 95]
                                )
                              )}
                            </SelectContent>{' '}
                             
                          </Select>{' '}
                           
                          <FormDescription className="text-slate-500">
                            The primary warehouse or bin where this product is usually stored.
                          </FormDescription>
                          <FormMessage className="text-red-400" />  
                        </FormItem> // 96]
                      )} // 96]
                    />{' '}
                     
                    <FormField
                      control={form.control} // 97]
                      name="isActive" // 97]
                      render={(
                        { field } // 97]
                      ) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border border-slate-700 p-4 bg-slate-800/50 hover:bg-slate-700/70 transition-colors">
                          {' '}
                           
                          <FormControl>
                            {' '}
                             
                            <Checkbox
                              checked={field.value} // 99]
                              onCheckedChange={field.onChange} // 99]
                              id="isActive" // 99]
                              className="border-slate-600 data-[state=checked]:bg-sky-500 data-[state=checked]:text-slate-900" // 00]
                            />
                          </FormControl>{' '}
                           
                          <div className="space-y-1 leading-none">
                            {' '}
                             
                            <FormLabel htmlFor="isActive" className="text-slate-300 cursor-pointer">
                              {' '}
                               
                              Product is Active
                            </FormLabel>{' '}
                             
                            <FormDescription className="text-slate-400">
                              {' '}
                               
                              Active products are available for sale and visible in your store/listings. Inactive
                              products are hidden.  
                            </FormDescription>{' '}
                             
                          </div>{' '}
                           
                        </FormItem> // 03]
                      )} // 03]
                    />
                  </CardContent>{' '}
                   
                </Card>{' '}
                 
                 Custom Fields Card (Example) */}
                <Card className="bg-slate-800/70 border-slate-700 shadow-xl transition-all hover:shadow-sky-500/20">
                  <CardHeader className="pb-3 border-b border-slate-700">
                    <CardTitle className="text-sky-400 text-xl flex items-center gap-2">
                      <Settings2 className="h-5 w-5" />
                      Custom Fields
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Additional product-specific information stored as JSON.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="customFields"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Custom Data (JSON format)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='e.g., { "warranty": "2 years", "material_composition": { "cotton": "80%", "polyester": "20%" } }'
                              {...field}
                              value={
                                typeof field.value === 'string'
                                  ? field.value
                                  : JSON.stringify(field.value ?? {}, null, 2)
                              }
                              onChange={e => {
                                try {
                                  const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                                  field.onChange(parsed);
                                } catch (err) {
                                  // Keep the string value if parsing fails, let Zod handle validation
                                  field.onChange(e.target.value);
                                }
                              }}
                              className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100 min-h-[100px] resize-y font-mono text-sm"
                            />
                          </FormControl>
                          <FormDescription className="text-slate-500">
                            Store any extra structured data for this product. Must be valid JSON.
                          </FormDescription>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>{' '}
               
               Right Column */}
              <div className="lg:col-span-5 space-y-8">
                {' '}
                 
                <Card className="bg-slate-800/70 border-slate-700 shadow-xl transition-all hover:shadow-sky-500/20">
                  {' '}
                   
                  <CardHeader className="pb-3 border-b border-slate-700">
                    {' '}
                     
                    <CardTitle className="text-sky-400 text-xl flex items-center justify-between">
                      {' '}
                       
                      <span className="flex items-center gap-2">
                        {' '}
                         
                        <ImagePlus className="h-5 w-5" /> Product Images  
                      </span>{' '}
                       
                      <Button
                        type="button" // 06]
                        variant="outline" // 06]
                        size="sm" // 07]
                        className="border-sky-500 text-sky-400 hover:bg-sky-500 hover:text-slate-900 h-8" // 07]
                        onClick={() => document.getElementById('imageUploadInput')?.click()} // 07]
                        disabled={isUploading || isPending} // 07]
                      >
                        {isUploading ? ( // 08]
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> // 09]
                        ) : (
                          // 09]
                          <ImagePlus className="mr-2 h-4 w-4" /> // 09]
                        )}{' '}
                         
                        Add Images
                      </Button>{' '}
                       
                    </CardTitle>{' '}
                     
                    <CardDescription className="text-slate-400">
                      {' '}
                       
                      Upload high-quality images. Good visuals sell products! You can drag & drop images here.{' '}
                       
                    </CardDescription>{' '}
                     
                  </CardHeader>{' '}
                   
                  <CardContent className="pt-6">
                    {' '}
                     
                    <FormField
                      control={form.control} // 11]
                      name="imageUrls"
                      render={(
                        { field }
                      ) => (
                        <FormItem>
                          {' '}
                           
                          <FormControl>
                            {' '}
                             
                            <>
                              {' '}
                               
                              <Input
                                id="imageUploadInput" // 13]
                                type="file" // 14]
                                accept="image/*" // 14]
                                multiple // 14]
                                className="hidden" // 14]
                                onChange={e => e.target.files && handleImageUpload(e.target.files)} // 15]
                                disabled={isUploading || isPending} // 15]
                              />{' '}
                               
                              <div
                                className={`relative min-h-[250px] border-2 border-dashed rounded-lg ${
                                  // 16]
                                  isDragging // 17]
                                    ? 'border-sky-500 bg-sky-700/20' // 18]
                                    : 'border-slate-600 hover:border-slate-500' // 18]
                                } transition-all duration-200 flex flex-col items-center justify-center p-4 text-center group`} // 18]
                                onDragOver={e => {
                                  // 19]
                                  e.preventDefault(); // 19]
                                  setIsDragging(true); // 20]
                                }} // 20]
                                onDragLeave={() => setIsDragging(false)} // 20]
                                onDrop={e => {
                                  // 20]
                                  e.preventDefault(); // 21]
                                  setIsDragging(false); // 21]
                                  if (e.dataTransfer.files) handleImageUpload(e.dataTransfer.files); // 21]
                                }} // 21]
                              >
                                {(field.value?.length ?? 0) > 0 || previewFiles.length > 0 ? ( // 21]
                                  <ScrollArea className="w-full h-[230px] mt-2">
                                    {' '}
                                     
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-3">
                                      {' '}
                                       
                                      {previewFiles.map(
                                        (
                                          item // 23]
                                        ) => (
                                          <div
                                            key={item.preview} // 24]
                                            className="relative group aspect-square rounded-md overflow-hidden border border-slate-700" // 24]
                                          >
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 z-10">
                                              {' '}
                                               
                                              <Loader2 className="h-8 w-8 animate-spin text-sky-400" />{' '}
                                               
                                            </div>{' '}
                                             
                                            <Image
                                              src={item.preview} // 27]
                                              alt="Uploading preview" // 27]
                                              fill // 28]
                                              className="object-cover" // 28]
                                            />
                                          </div> // 29]
                                        )
                                      )}
                                      {field.value?.map(
                                        (
                                          url // 30]
                                        ) => (
                                          <div
                                            key={url} // 30]
                                            className="relative group aspect-square rounded-md overflow-hidden border border-slate-700" // 31]
                                          >
                                            <Image
                                              src={url} // 32]
                                              alt="Product Image" // 33]
                                              fill // 33]
                                              className="object-cover transition-transform group-hover:scale-105" // 34]
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                              {' '}
                                               
                                              <Button
                                                type="button" // 35]
                                                variant="destructive" // 36]
                                                size="icon" // 36]
                                                className="h-9 w-9 bg-red-600 hover:bg-red-700" 
                                                onClick={() => removeImage(url)} 
                                                disabled={isPending} // 38]
                                              >
                                                <Trash2 className="h-4 w-4" />  
                                              </Button>{' '}
                                               
                                            </div>{' '}
                                             
                                          </div> 
                                        )
                                      )}
                                    </div>{' '}
                                     
                                  </ScrollArea> // 41]
                                ) : (
                                  // 41]
                                  <label
                                    htmlFor="imageUploadInput" // 42]
                                    className="flex flex-col items-center justify-center h-full cursor-pointer text-slate-400 group-hover:text-sky-400 transition-colors" // 42]
                                  >
                                    <ImagePlus className="h-12 w-12 mb-3" />  
                                    <p className="text-sm mb-1">
                                      {' '}
                                       
                                      {isUploading ? 'Uploading images...' : 'Drag & drop or click to browse'}{' '}
                                       
                                    </p>{' '}
                                     
                                    <p className="text-xs text-slate-500">
                                      Recommended: Square, high-resolution images (e.g., JPG, PNG, WebP)
                                    </p>{' '}
                                     
                                  </label> // 46]
                                )}
                                {isDragging && ( // 46]
                                  <DragOverlay
                                    text="Drop images here to upload" // 47]
                                    className="bg-sky-600/30 text-sky-200 border-sky-400" // 47]
                                  /> // 48]
                                )}
                              </div>{' '}
                               
                            </>{' '}
                             
                          </FormControl>{' '}
                           
                          <FormDescription className="text-slate-500">
                            The first image will be the main display image. Drag to reorder if backend supports it, or
                            manage order via other means.
                          </FormDescription>
                          <FormMessage className="text-red-400" />  
                        </FormItem> // 49]
                      )} // 50]
                    />{' '}
                     
                  </CardContent>{' '}
                   
                </Card>{' '}
                 
                <Card className="bg-slate-800/70 border-slate-700 shadow-xl transition-all hover:shadow-sky-500/20">
                  {' '}
                   
                  <CardHeader className="pb-3 border-b border-slate-700">
                    {' '}
                     
                    <CardTitle className="text-sky-400 text-xl flex items-center justify-between">
                      {' '}
                       
                      <span className="flex items-center gap-2">
                        {' '}
                         
                        <Package className="h-5 w-5 rotate-90" /> Product Variants  
                      </span>{' '}
                       
                      <Button
                        type="button" // 52]
                        variant="outline" // 52]
                        className="border-sky-500 text-sky-400 hover:bg-sky-500 hover:text-slate-900 h-8 flex items-center gap-1" // 53]
                        onClick={() => handleOpenVariantModal()} // 53]
                      >
                        <PlusCircle className="h-4 w-4" /> Add Variant  
                      </Button>{' '}
                       
                    </CardTitle>{' '}
                     
                    <CardDescription className="text-slate-400">
                      {' '}
                       
                      Define different options for this product, such as size, color, or material. Each variant can have
                      its own SKU, price, and stock level.  
                    </CardDescription>{' '}
                     
                  </CardHeader>{' '}
                   
                  <CardContent className="pt-6">
                    {' '}
                     
                    {variantFields.length > 0 ? ( // 55]
                      <ScrollArea className="max-h-80">
                        {' '}
                         
                        <div className="space-y-3 pr-3">
                          {' '}
                           
                          {variantFields.map((field, index) => {
                            // 56]
                            const variant = form.watch(`variants.${index}`); // 56]
                            return (
                              <div
                                key={field.id} // 57]
                                className="p-4 border border-slate-700 rounded-lg bg-slate-800 hover:border-sky-600/70 transition-all group cursor-pointer shadow-md hover:shadow-sky-500/10" // 57]
                                onClick={() =>
                                  handleOpenVariantModal({
                                    ...form.getValues(`variants.${index}`),
                                    id: field.id,
                                    index,
                                  })
                                } // 58]
                              >
                                <div className="flex justify-between items-start">
                                  {' '}
                                   
                                  <div>
                                    <p className="font-semibold text-slate-100 group-hover:text-sky-400 transition-colors text-md">
                                      {' '}
                                       
                                      {variant.name || `Variant ${index + 1}`}  
                                    </p>
                                    <div className="text-xs text-slate-400 mt-1">
                                      SKU: {variant.sku || <span className="italic">Not set</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {' '}
                                     
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${variant.isActive ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`} // 61]
                                    >
                                      {variant.isActive ? 'Active' : 'Inactive'}  
                                    </span>{' '}
                                     
                                    <Button
                                      type="button" // 64]
                                      variant="ghost" // 64]
                                      size="icon" // 64]
                                      className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-50 group-hover:opacity-100 transition-opacity" // 65]
                                      onClick={e => {
                                        // 65]
                                        e.stopPropagation(); // 65]
                                        removeVariant(index); // 66]
                                        toast.info('Variant removed. Save product to confirm changes.'); // 66]
                                      }} // 66]
                                      disabled={isPending}
                                    >
                                      <Trash2 className="h-4 w-4" />  
                                    </Button>{' '}
                                     
                                  </div>{' '}
                                   
                                </div>{' '}
                                 
                                <div className="mt-3 text-sm text-slate-300 space-y-1 border-t border-slate-700/50 pt-3">
                                  {' '}
                                   
                                  <div className="flex justify-between">
                                    {' '}
                                     
                                    <span className="text-slate-500">Price Mod:</span>  
                                    <span>
                                      {' '}
                                       
                                      {variant.priceModifierType === 'percentage' // 71]
                                        ? `${variant.priceModifier || 0}%` // 72]
                                        : `${variant.priceModifier >= 0 ? '+' : ''}${form.watch('buyingPrice') ? '$' : ''}${(variant.priceModifier || 0).toFixed(2)}`}{' '}
                                       
                                    </span>{' '}
                                     
                                  </div>{' '}
                                   
                                  <div className="flex justify-between">
                                    {' '}
                                     
                                    <span className="text-slate-500">Stock:</span>  
                                    <span>{variant.stockQuantity} units</span>  
                                  </div>{' '}
                                   
                                  {variant.buyingPrice && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Buying Price:</span>
                                      <span>${variant.buyingPrice.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {variant.retailPrice && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Retail Price:</span>
                                      <span>${variant.retailPrice.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {Object.entries(
                                    typeof variant.attributes === 'object' && variant.attributes !== null
                                      ? variant.attributes
                                      : {}
                                  ).length > 0 && (
                                    <div className="pt-1 mt-1 border-t border-slate-700/30">
                                      <span className="text-slate-500 text-xs">Attributes: </span>
                                      <span className="text-xs text-slate-400">
                                        {Object.entries(variant.attributes as Record<string, any>)
                                          .map(([key, val]) => `${key}: ${val}`)
                                          .join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>{' '}
                                 
                              </div> // 75]
                            );
                          })}{' '}
                           
                        </div>{' '}
                         
                      </ScrollArea> // 76]
                    ) : (
                      // 76]
                      <div className="p-6 text-center border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/30">
                        {' '}
                         
                        <Package className="h-12 w-12 mx-auto text-slate-500 mb-3" />
                        <p className="text-slate-400 mb-1 font-medium">No variants defined yet.</p>  
                        <p className="text-slate-500 mb-4 text-sm">
                          If your product comes in different versions (e.g., size, color), add them as variants.
                          Otherwise, the product will use its base details.
                        </p>{' '}
                         
                        <Button
                          type="button" // 78]
                          variant="outline" // 78]
                          className="border-sky-600 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300" // 78]
                          onClick={() => handleOpenVariantModal()} // 78]
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Add First Variant  
                        </Button>{' '}
                         
                      </div> // 79]
                    )}{' '}
                     
                  </CardContent>{' '}
                   
                </Card>{' '}
                 
              </div>{' '}
               
            </div>{' '}
             
            <div className="sticky bottom-0 -mx-6 -mb-8 sm:-mx-8 sm:-mb-8 mt-12 p-4 bg-slate-900/80 border-t border-slate-700 backdrop-blur-sm z-20">
              {' '}
               
              <div className="container mx-auto flex justify-between items-center">
                {' '}
                 
                <Button
                  type="button" // 81]
                  variant="outline" // 81]
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100" // 81]
                  onClick={() => router.back()} // 82]
                  disabled={isPending} // 82]
                >
                  Cancel  
                </Button>{' '}
                 
                <Button
                  type="submit" // 83]
                  className="min-w-[160px] bg-sky-500 hover:bg-sky-600 text-slate-900 font-semibold disabled:bg-sky-500/50" // 83]
                  disabled={isPending || isUploading || (!form.formState.isDirty && !form.formState.isSubmitting)} // 83]
                >
                  {isPending ? ( // 84]
                    <>
                      {' '}
                       
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />  
                      Saving Changes...  
                    </> // 85]
                  ) : (
                    // 86]
                    'Save Product Changes' // 86]
                  )}
                </Button>{' '}
                 
              </div>{' '}
               
            </div>{' '}
             
          </form>{' '}
           
        </Form>{' '}
         
      </div>{' '}
       
    </> // 87]
  ); // 88]
}
