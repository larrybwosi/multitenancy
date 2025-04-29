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
import { useLocations, useSuppliers } from '@/lib/hooks/use-supplier';
import { DragOverlay } from '@/components/ui/drag-overlay';
// import { VariantModal } from '../add/variant'; // Assuming VariantModal is typed correctly
import { Checkbox } from '@/components/ui/checkbox';
 import { Prisma } from '@prisma/client'; // Needed for JsonNull comparison/usage if applicable post-validation
// import Loading from './loading';
 import {
    AddProductSchema,
    EditProductSchema,
    ProductVariantInput, // Keep for VariantModal prop typing if needed externally
    ProductSupplierInput, // Keep for potential SupplierModal prop typing
    AddProductSchemaType,
    EditProductSchemaType,
    ProductVariantSchema, // Import for explicit variant typing if needed
    ProductSupplierSchema, // Import for explicit supplier typing if needed
} from '@/lib/validations/product'; // Assuming this is the path to your validation file
import { z } from 'zod'; // Import z if not already globally available
import Loading from '../loading';

// --- REMOVED Manual Types: CustomField, AttributeField, ProductFormType ---
// We will infer the form type directly from the Zod schemas.

// Define the expected shape of the product data fetched for editing
// This should align with what your API/database query returns.
// It might be slightly different from the Zod schema input type (e.g., Date objects vs. strings).
// For simplicity, we'll assume it closely matches EditProductSchemaType structure,
// but you might need adjustments based on your actual data fetching.
type ProductForEditing = Omit<EditProductSchemaType, 'suppliers' | 'variants'> & {
    id: string;
    // Variants and Suppliers as potentially fetched from DB (adjust types if needed, e.g., Date objects)
    variants: (ProductVariantInput & { id?: string })[];
    suppliers: (ProductSupplierInput & { id?: string })[];
    // Add any other fields returned by your product fetching logic
};

interface AddProductFormProps {
    product?: ProductForEditing; // Optional product data for editing
}

export default function AddProductForm({ product }: AddProductFormProps) {
    const router = useRouter();
     const [isPending, startTransition]= useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);
     const [variantModalOpen, setVariantModalOpen] = useState(false);
    // const [supplierModalOpen, setSupplierModalOpen] = useState(false); // Uncomment if using supplier modal
     const [isDragging, setIsDragging] = useState(false);
    const [previewFiles, setPreviewFiles] = useState<{ file: File; preview: string }[]>([]);
     const isEditMode = !!product?.id;

    // Determine the correct schema based on mode
    const currentSchema = isEditMode ? EditProductSchema : AddProductSchema;

    // Infer the form values type directly from the current Zod schema
    type ProductFormValues = z.infer<typeof currentSchema>;

     const form = useForm<ProductFormValues>({
        // Use the inferred type
        resolver: zodResolver(currentSchema),
        defaultValues: isEditMode
            ? {
                  // Map product data for editing. Rely on Zod coercion for types.
                  // Ensure null/undefined are handled correctly for optional fields.
                  productId: product.id, // Required by EditProductSchema
                  name: product.name ?? '',
                  description: product.description ?? null,
                  sku: product.sku ?? null, // SKU required for edit in schema, ensure value or null
                  barcode: product.barcode ?? null,
                  categoryId: product.categoryId ?? '',
                   basePrice: product.basePrice ?? 0, // Zod coerces
                  baseCost: product.baseCost ?? null, // Zod coerces
                  isActive: product.isActive ?? true, // Zod transforms
                  imageUrls: product.imageUrls ?? [],
                  customFields: product.customFields ?? Prisma.JsonNull, // Zod handles JSON
                  width: product.width ?? null, // Zod coerces
                  height: product.height ?? null, // Zod coerces
                  length: product.length ?? null, // Zod coerces
                  weight: product.weight ?? null, // Zod coerces
                  volumetricWeight: product.volumetricWeight ?? null, // Zod coerces
                   reorderPoint: product.reorderPoint ?? 5, // Zod coerces
                  defaultLocationId: product.defaultLocationId ?? null,
                  variants:
                      product.variants?.map(v => ({
                          id: v.id, // Keep ID for editing
                          name: v.name ?? '',
                          sku: v.sku ?? null,
                          barcode: v.barcode ?? null,
                           priceModifier: v.priceModifier ?? 0, // Zod coerces
                           attributes: v.attributes ?? Prisma.JsonNull, // Zod handles JSON
                           isActive: v.isActive ?? true, // Zod transforms
                           reorderPoint: v.reorderPoint ?? 5, // Zod coerces
                           reorderQty: v.reorderQty ?? 10, // Zod coerces
                           lowStockAlert: v.lowStockAlert ?? false, // Zod transforms
                      })) ?? [],
                  suppliers:
                      product.suppliers?.map(s => ({
                          id: s.id, // Keep ID for editing
                          supplierId: s.supplierId ?? '',
                          supplierSku: s.supplierSku ?? null,
                          costPrice: s.costPrice ?? 0, // Zod coerces
                          minimumOrderQuantity: s.minimumOrderQuantity ?? null, // Zod coerces
                          packagingUnit: s.packagingUnit ?? null,
                          isPreferred: s.isPreferred ?? false, // Zod transforms
                      })) ?? [],
              }
            : {
                  // Default values for Add mode - align with Zod schema defaults/types
                  name: '',
                  description: null,
                  sku: null, // Optional in AddProductSchema
                  barcode: null,
                  categoryId: '',
                  basePrice: undefined, // Let Zod handle coercion from undefined/empty input
                  baseCost: null,
                  isActive: true,
                  imageUrls: [],
                  customFields: Prisma.JsonNull,
                  width: null,
                  height: null,
                  length: null,
                  weight: null,
                  volumetricWeight: null,
                  reorderPoint: 5,
                  defaultLocationId: null,
                  variants: [],
                  suppliers: [],
              },
        mode: 'onChange', // Or 'onBlur'/'onSubmit' as needed
    });

    // --- REMOVED useEffect for form.reset ---
    // The reset logic is now handled directly within the defaultValues definition
    // based on the isEditMode flag. This simplifies the logic.

     const {
        fields: variantFields,
        append: appendVariant, // Renamed to avoid conflict if supplier array is added
        remove: removeVariant,
        // update: updateVariant, // Keep if using fine-grained updates
    } = useFieldArray({
        control: form.control,
        name: 'variants',
        keyName: "fieldId", // Recommended for better key stability if needed
    });

    // Example for suppliers field array (if needed)
    /*
    const {
        fields: supplierFields,
        append: appendSupplier,
        remove: removeSupplier,
    } = useFieldArray({
        control: form.control,
        name: 'suppliers',
        keyName: "fieldId",
    });
    */

     const { data: locationsResult, error: locationsError, isLoading: isLoadingLocations } = useLocations();
    const locations = locationsResult?.warehouses || [];
     const { data: suppliersResult, error: suppliersError, isLoading: isLoadingSuppliers } = useSuppliers();
    const suppliersList = suppliersResult?.data || [];
     const { data: categoriesResult, error: categoriesError, isLoading: isLoadingCategories } = useCategories();
    const categories = categoriesResult?.data || [];

    // --- Image Upload Logic (largely unchanged, ensure robust error handling) ---
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
            const failedFiles: string[] = [];

             for (const { file, preview } of newPreviews) {
                try {
                    const formData = new FormData();
                    formData.append('file', file);

                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    });
                     if (!response.ok) {
                        let errorMsg = `Upload failed for ${file.name}`;
                        try {
                            const errorBody = await response.json();
                            errorMsg = errorBody.error || errorMsg;
                        } catch { /* Ignore parsing error */ }
                        throw new Error(errorMsg);
                    }

                    const data = await response.json();
                    if (!data.url || typeof data.url !== 'string') {
                        throw new Error(`Invalid response URL for ${file.name}`);
                    }

                    uploadedUrls.push(data.url);
                    // Remove successful preview (immediate feedback) - keep file info if needed
                     URL.revokeObjectURL(preview);
                    setPreviewFiles(prev => prev.filter(p => p.preview !== preview));

                } catch (error) {
                    console.error(`Failed uploading ${file.name}:`, error);
                    failedFiles.push(file.name);
                    // Keep failed preview for user to see, maybe add error state to it?
                     URL.revokeObjectURL(preview); // Still revoke if failed permanently
                    setPreviewFiles(prev => prev.filter(p => p.preview !== preview)); // Remove if not retryable
                }
            }

             setIsUploading(false);

            if (uploadedUrls.length > 0) {
                  const currentUrls = form.getValues('imageUrls') || [];
                 form.setValue('imageUrls', [...currentUrls, ...uploadedUrls], { shouldValidate: true, shouldDirty: true });
                toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
            }

             if (failedFiles.length > 0) {
                 const errorMsg = `Failed to upload: ${failedFiles.join(', ')}. Please try again.`;
                setGeneralError(errorMsg);
                toast.error(errorMsg);
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
             // Optional: Call an API endpoint to delete the image from storage
             /*
             fetch('/api/upload/delete', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ url: urlToRemove }),
             }).catch(err => console.error("Failed to delete image from storage:", err));
             */
        },
        [form]
    );

    // --- onSubmit Handler - uses validated data ---
     const onSubmit = async (values: ProductFormValues) => {
        // 'values' is the validated and transformed data from Zod
        setGeneralError(null);
        console.log('Validated Form Values:', values); // Debug: See Zod output

        startTransition(async () => {
            try {
                const apiUrl = isEditMode ? `/api/products/${product.id}` : '/api/products';
                const apiMethod = isEditMode ? 'PUT' : 'POST';

                // The 'values' object should now conform to AddProductSchemaType or EditProductSchemaType.
                // The backend API endpoint will receive this structured data.
                // No need for the manual 'payload' construction unless the API expects a slightly different structure
                // than what Zod outputs (which should be rare if schemas are aligned).
                // Ensure the backend Prisma call correctly handles nested writes for variants/suppliers.
                 const response = await fetch(apiUrl, {
                    method: apiMethod,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // Send the Zod-validated 'values' directly
                    body: JSON.stringify(values),
                });

                 const result = await response.json();

                if (!response.ok) {
                     const errorData = result as { fieldErrors?: Record<string, string[]>; error?: string };
                    if (errorData.fieldErrors) {
                        // Attempt to map server errors back to form fields
                        Object.entries(errorData.fieldErrors).forEach(([field, errors]) => {
                            try {
                                // Need to handle nested paths like 'variants.0.name'
                                const fieldName = field as keyof ProductFormValues;
                                form.setError(fieldName, {
                                    type: 'server',
                                    message: Array.isArray(errors) ? errors.join(', ') : String(errors),
                                });
                            } catch (formError) {
                                console.warn(`Failed to set error for field: ${field}`, formError);
                                // Add to general error if specific field setting fails
                                setGeneralError(prev => `${prev ? prev + '; ' : ''}${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`);
                            }
                        });
                    }
                    // Use server error message if available, otherwise construct one
                     throw new Error(errorData.error || result.message || `Request failed with status ${response.status}`);
                }

                 toast.success(`Product ${isEditMode ? 'updated' : 'added'} successfully!`);
                 router.push('/products'); // Or detail page: `/products/${result.id}`
                 router.refresh(); // Refresh server components

            } catch (error: unknown) {
                 const message = error instanceof Error ? error.message : 'An unexpected error occurred during submission.';
                console.error('Form submission error:', error);
                setGeneralError(message);
                toast.error(message);

                // Attempt to focus the first field with an error
                 const firstErrorField = Object.keys(form.formState.errors)[0];
                if (firstErrorField) {
                     try {
                        form.setFocus(firstErrorField as keyof ProductFormValues);
                    } catch {
                         console.warn('Could not focus error field:', firstErrorField);
                         // Fallback scroll attempt
                         try {
                            const elements = document.getElementsByName(firstErrorField);
                             elements[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } catch { /* ignore focus/scroll error */ }
                    }
                }
            }
        });
    };

    // --- Loading and Error States for Data Fetching ---
     if (isLoadingCategories || isLoadingLocations || isLoadingSuppliers) {
        return <Loading />;
    }

     const dataLoadingError = categoriesError || locationsError || suppliersError;
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

    // Helper to manage variant modal state
     const handleManageVariants = () => {
        setVariantModalOpen(true);
    };

    // --- RENDER LOGIC ---
    // Most of the JSX remains the same, but key changes:
    // 1.  Removed manual type casts where possible.
    // 2.  Ensured `value={field.value ?? ''}` for text-based inputs.
    // 3.  Ensured `onChange={e => field.onChange(e.target.value)}` for text inputs feeding number coercion.
    // 4.  Ensured `onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}` for integer inputs[cite: 166, 167].
    // 5.  Ensured `checked={!!field.value}` for checkboxes[cite: 171].
    // 6.  Field names in `form.watch` and `FormField` `name` prop must exactly match keys in `ProductFormValues` (e.g., `variants.0.name` is handled by `useFieldArray`).

    return (
        <>
            {/* Pass correct props to VariantModal - it should accept ProductVariantInput[] and callbacks */}
            {/* <VariantModal
                open={variantModalOpen}
                onOpenChange={setVariantModalOpen}
                variants={form.watch('variants')} // Pass current form state variants
                onAddVariant={variant => {
                    // Ensure added variant matches schema structure before appending
                    const parseResult = ProductVariantSchema.safeParse(variant);
                    if (parseResult.success) {
                        appendVariant(parseResult.data as any); // Append validated/coerced data
                    } else {
                        console.error("Invalid variant data:", parseResult.error);
                        toast.error("Could not add invalid variant.");
                    }
                }}
                onRemoveVariant={index => removeVariant(index)}
                // updateVariant={(index, variant) => updateVariant(index, variant)} // Implement if needed
            /> */}

             <div className="container mx-auto p-4 space-y-6">

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
                            {/* --- Left Column --- */}
                             <div className="lg:col-span-6 space-y-6">
                                {/* Basic Info Card */}
                                <Card /* ...props */ >
                                    <CardHeader /* ...props */ />
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Product Name */}
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
                                             {/* SKU (Required for Edit, Optional for Add) */}
                                             <FormField
                                                control={form.control}
                                                name="sku"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>SKU {isEditMode ? '*' : '(Optional)'}</FormLabel>
                                                    <FormControl>
                                                    <Input placeholder="e.g., TSHIRT-RED-XL" {...field} value={field.value ?? ''} className="bg-background/60" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                        </div>
                                         {/* Barcode */}
                                         <FormField
                                            control={form.control}
                                            name="barcode"
                                            render={({ field }) => (
                                                <FormItem>
                                                     <FormLabel>Barcode (Optional)</FormLabel>
                                                    <FormControl>
                                                        {/* Use ?? '' to handle null value for controlled input */}
                                                         <Input placeholder="e.g., 9876543210" {...field} value={field.value ?? ''} className="bg-background/60" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {/* Description */}
                                         <FormField /* ...props */ name="description" render={({ field }) => (
                                             <FormItem>
                                                <FormLabel>Description (Optional)</FormLabel>
                                                <FormControl>
                                                     <Textarea placeholder="Detailed description..." {...field} value={field.value ?? ''} className="bg-background/60 min-h-[120px" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Category */}
                                             <FormField
                                                control={form.control}
                                                name="categoryId"
                                                render={({ field }) => (
                                                     <FormItem>
                                                        <FormLabel>Category *</FormLabel>
                                                        <Select value={field.value ?? ''} onValueChange={field.onChange} disabled={isPending || isLoadingCategories}>
                                                            <FormControl>
                                                                 <SelectTrigger className="bg-background/60">
                                                                    {isLoadingCategories ? <span className="text-muted-foreground">Loading...</span> : <SelectValue placeholder="Select a category" />}
                                                                </SelectTrigger>
                                                            </FormControl>
                                                             <SelectContent>
                                                                {categories.map(category => (
                                                                     <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            {/* Base Price */}
                                             <FormField
                                                control={form.control}
                                                name="basePrice"
                                                render={({ field }) => (
                                                     <FormItem>
                                                        <FormLabel>Base Price *</FormLabel>
                                                        <FormControl>
                                                            {/* Pass string value to let Zod coerce */}
                                                             <Input type="text" inputMode="decimal" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value)} className="bg-background/60" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Base Cost */}
                                             <FormField
                                                control={form.control}
                                                name="baseCost"
                                                render={({ field }) => (
                                                     <FormItem>
                                                        <FormLabel>Base Cost (Optional)</FormLabel>
                                                        <FormControl>
                                                            {/* Pass string value for coercion */}
                                                             <Input type="text" inputMode="decimal" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value)} className="bg-background/60" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                             {/* Default Location */}
                                             <FormField
                                                control={form.control}
                                                name="defaultLocationId"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Default Location (Optional)</FormLabel>
                                                    <Select value={field.value ?? ''} onValueChange={field.onChange} disabled={isPending || isLoadingLocations}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background/60">
                                                        {isLoadingLocations ? <span className="text-muted-foreground">Loading...</span> : <SelectValue placeholder="Select default location" />}
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {/* Add a 'None' option */}
                                                        <SelectItem value="">None</SelectItem>
                                                        {locations.map((location: any) => ( // Use specific type for location if available
                                                        <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
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

                                {/* Physical Attributes Card */}
                                 <Card /* ...props */ >
                                    <CardHeader /* ...props */ >
                                         <CardTitle className="text-primary text-xl">Physical Attributes (Optional)</CardTitle>
                                         <CardDescription>Specify dimensions and weight.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Dimensions */}
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
                                                                {/* Pass string for coercion */}
                                                                <Input type="text" inputMode="decimal" placeholder="0.0" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value)} className="bg-background/60" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                         {/* Weight */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="weight"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Weight</FormLabel>
                                                        <FormControl>
                                                             {/* Pass string for coercion */}
                                                            <Input type="text" inputMode="decimal" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value)} className="bg-background/60" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                             {/* Volumetric Weight */}
                                             <FormField
                                                control={form.control}
                                                name="volumetricWeight"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Volumetric Weight</FormLabel>
                                                        <FormControl>
                                                             {/* Pass string for coercion */}
                                                            <Input type="text" inputMode="decimal" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value)} className="bg-background/60" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>


                                    </CardContent>
                                </Card>
                            </div>

                            {/* --- Right Column --- */}
                            <div className="lg:col-span-6 space-y-6">
                                {/* Inventory Settings Card */}
                                <Card /* ...props */ >
                                    <CardHeader /* ...props */ />
                                    <CardContent className="space-y-4">
                                        {/* Reorder Point */}
                                        <FormField
                                            control={form.control}
                                            name="reorderPoint"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Reorder Point</FormLabel>
                                                    <FormControl>
                                                        {/* Integer input: Ensure parsing */}
                                                        <Input
                                                            type="number"
                                                            step="1"
                                                            placeholder="e.g., 5"
                                                            {...field}
                                                            value={field.value ?? ''} // Controlled input needs string or number
                                                            onChange={e => {
                                                                // Allow empty input (becomes undefined/null via Zod)
                                                                // Parse valid integer input
                                                                const val = e.target.value;
                                                                field.onChange(val === '' ? undefined : parseInt(val, 10));
                                                            }}
                                                            className="bg-background/60"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {/* Active Status */}
                                        <FormField
                                            control={form.control}
                                            name="isActive"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-background/30">
                                                    <FormControl>
                                                        {/* Use !! to ensure boolean for checked prop */}
                                                        <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>Active Product</FormLabel>
                                                        <p className="text-sm text-muted-foreground">
                                                            Make this product available for sale and visible.
                                                        </p>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Variants Card */}
                                <Card /* ...props */ >
                                    <CardHeader className="pb-2">
                                         <CardTitle className="text-primary text-xl flex items-center justify-between">
                                            <span>Product Variants</span>
                                            <Button type="button" variant="outline" onClick={handleManageVariants} className="h-8">
                                                Manage Variants
                                            </Button>
                                        </CardTitle>
                                        <CardDescription>Configure variations (size, color, etc.).</CardDescription>
                                    </CardHeader>
                                     <CardContent>
                                         {variantFields.length > 0 ? (
                                             <ScrollArea className="h-60">
                                                 <div className="space-y-2 pr-3">
                                                     {variantFields.map((field, index) => (
                                                         // Use field.fieldId for the key
                                                         <div key={field.fieldId} className="p-3 border rounded bg-background/50 hover:bg-background/80 transition-colors">
                                                             <div className="flex justify-between items-center">
                                                                 <p className="font-medium">
                                                                    {/* Watch the specific field in the array */}
                                                                    {form.watch(`variants.${index}.name`) || 'Unnamed Variant'}
                                                                 </p>
                                                                 {/* Edit button could open modal with index */}
                                                             </div>
                                                             <div className="mt-1 text-sm text-muted-foreground space-y-1">
                                                                <div className="flex justify-between">
                                                                     <span>SKU: {form.watch(`variants.${index}.sku`) || 'N/A'}</span>
                                                                     <span className={form.watch(`variants.${index}.isActive`) ? 'text-green-500' : 'text-red-500'}>
                                                                         {form.watch(`variants.${index}.isActive`) ? 'Active' : 'Inactive'}
                                                                     </span>
                                                                 </div>
                                                                 <div className="flex justify-between">
                                                                     <span>Price Mod: {form.watch(`variants.${index}.priceModifier`)}</span>
                                                                     <span>Barcode: {form.watch(`variants.${index}.barcode`) || 'N/A'}</span>
                                                                 </div>
                                                                 <div className="flex justify-between">
                                                                     <span>Reorder: {form.watch(`variants.${index}.reorderPoint`)} / {form.watch(`variants.${index}.reorderQty`)}</span>
                                                                     <span className={form.watch(`variants.${index}.lowStockAlert`) ? 'text-amber-500' : ''}>
                                                                        {form.watch(`variants.${index}.lowStockAlert`) ? 'Low Stock Alert' : ''}
                                                                     </span>
                                                                 </div>
                                                                 {/* Optionally display simple attributes: JSON.stringify(form.watch(`variants.${index}.attributes`)) */}
                                                             </div>
                                                         </div>
                                                     ))}
                                                 </div>
                                             </ScrollArea>
                                         ) : (
                                             <div className="p-4 text-center">
                                                 <p className="text-muted-foreground">No variants defined.</p>
                                                 <Button type="button" variant="outline" onClick={handleManageVariants} className="mt-2">
                                                     Add Variants
                                                 </Button>
                                             </div>
                                         )}
                                     </CardContent>
                                </Card>

                                {/* Product Images Card */}
                                <Card /* ...props */ >
                                   <CardHeader /* ...props */ />
                                    <CardContent>
                                        <FormField
                                            control={form.control}
                                            name="imageUrls"
                                            render={({ field }) => ( // Use field from render prop
                                                <FormItem>
                                                    <FormControl>
                                                        <>
                                                            <Input
                                                                id="imageUploadInput"
                                                                type="file"
                                                                accept="image/*"
                                                                multiple
                                                                className="hidden"
                                                                // Reset input value on change to allow re-uploading same file
                                                                onChange={e => {
                                                                    if (e.target.files) handleImageUpload(e.target.files);
                                                                    e.target.value = ''; // Reset file input
                                                                }}
                                                                disabled={isUploading || isPending}
                                                            />
                                                            {/* Dropzone UI */}
                                                            <div
                                                                className={`relative min-h-[250pxborder-2 border-dashed rounded-lg ${
                                                                    isDragging ? 'border-primary bg-primary/10' : 'border-muted'
                                                                } transition-colors duration-200 flex flex-col`}
                                                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                                                onDragLeave={() => setIsDragging(false)}
                                                                onDrop={e => {
                                                                    e.preventDefault();
                                                                    setIsDragging(false);
                                                                    if (e.dataTransfer.files) handleImageUpload(e.dataTransfer.files);
                                                                }}
                                                            >
                                                                 {/* Display Area */}
                                                                 {(field.value?.length ?? 0) > 0 || previewFiles.length > 0 ? (
                                                                    <div className="p-4 flex-grow flex flex-col">
                                                                        <div className="flex justify-between items-center mb-2">
                                                                             <FormLabel className="text-sm font-medium">Uploaded Images</FormLabel>
                                                                             {/* Add More Button triggers hidden input */}
                                                                             <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('imageUploadInput')?.click()} disabled={isUploading || isPending}>
                                                                                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                                                                                  Add More
                                                                             </Button>
                                                                        </div>
                                                                         <ScrollArea className="flex-grow h-[180px]"> {/* Adjust height as needed */}
                                                                             {<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pr-3">
                                                                                {/* Previews */}
                                                                                 {previewFiles.map(item => (
                                                                                     <div key={item.preview} className="relative group aspect-square">
                                                                                         {<div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 rounded-lg">
                                                                                             <Loader2 className="h-6 w-6 animate-spin text-white" />
                                                                                         </div>
                                                                                         <Image src={item.preview} alt="Uploading preview" layout="fill" objectFit="cover" className="rounded-lg border border-muted" />
                                                                                     </div>
                                                                                 ))}
                                                                                 {/* Uploaded */}
                                                                                 {field.value?.map((url: string) => (
                                                                                    <div key={url} className="relative group aspect-square">
                                                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg z-10">
                                                                                             {<Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeImage(url)} disabled={isPending}>
                                                                                                <Trash2 className="h-4 w-4" />
                                                                                            </Button>}
                                                                                        </div>
                                                                                        <Image src={url} alt="Product Image" layout="fill" objectFit="cover" className="rounded-lg border border-muted" />
                                                                                    </div>
                                                                                 ))}
                                                                             </div>}
                                                                         </ScrollArea>
                                                                    </div>
                                                                ) : (
                                                                    // Placeholder
                                                                    <label htmlFor="imageUploadInput" className="flex flex-col items-center justify-center h-full p-6 cursor-pointer flex-grow">
                                                                        <ImagePlus className="h-12 w-12 text-muted-foreground mb-4" />
                                                                        <p className="text-sm text-muted-foreground text-center mb-2">
                                                                            {isUploading ? 'Uploading...' : 'Drag & drop or click browse'}
                                                                        </p>
                                                                        {!isUploading && <Button type="button" variant="outline" disabled={isPending}>Browse</Button>}
                                                                    </label>
                                                                )}
                                                                 {/* Drag Overlay */}
                                                                 {isDragging && <DragOverlay />}
                                                            </div>
                                                        </>
                                                    </FormControl>
                                                    <FormMessage /> {/* Error for the imageUrls field itself */}
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* --- Sticky Footer --- */}
                        <div className="sticky bottom-0 -mx-4 -mb-4 mt-8 p-4 bg-background/95 border-t border-border backdrop-blur-sm z-20">
                            <div className="container mx-auto flex justify-between items-center">
                                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
                                <Button type="submit" className="min-w-[150px]" disabled={isPending || isUploading || !form.formState.isDirty}>
                                    {isPending ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditMode ? 'Saving...' : 'Adding...'}</>
                                    ) : (isEditMode ? 'Save Changes' : 'Add Product')}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    );
}