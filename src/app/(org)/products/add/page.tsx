// src/components/products/AddProductForm.tsx
'use client';

import { useState, useTransition, useCallback, ChangeEvent, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation'; 
import { toast } from 'sonner'; 
import { addProduct } from '@/actions/products';

// --- UI Components (Assuming Shadcn/ui) ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, UploadCloud, Loader2, CircleAlert, Terminal, PackagePlus } from 'lucide-react';
import Image from 'next/image';
import { ProductInput, ProductSchema, ProductSupplierInput, ProductVariantInput } from '@/lib/validations/product';
import { uploadSanityAsset } from '@/actions/uploads';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useCategories } from '@/lib/hooks/use-categories';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Helper Types (Simulated Fetch Data) ---
interface Supplier {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  locationType: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- Default Values ---
const defaultVariant: Omit<ProductVariantInput, 'id'> = {
  name: 'Standard',
  sku: '',
  priceModifier: 0,
  isActive: true,
  reorderPoint: 5,
  reorderQty: 10,
  lowStockAlert: false,
  barcode: '',
  attributes: {},
};

const defaultProductSupplier: Omit<ProductSupplierInput, 'supplierId'> = {
  supplierSku: '',
  costPrice: 0,
  minimumOrderQuantity: 1,
  packagingUnit: '',
  isPreferred: false,
};

export function AddProductForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string[] | undefined>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // 1. Define your form.
  const form = useForm({
    resolver: zodResolver(ProductSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      barcode: "",
      categoryId: "",
      basePrice: 0,
      isActive: true,
      imageUrls: [],
      width: undefined,
      height: undefined,
      depth: undefined,
      dimensionUnit: "cm",
      weight: undefined,
      weightUnit: "kg",
      volumetricWeight: undefined,
      reorderPoint: 10,
      defaultLocationId: "",
      variants: [
        {
          name: "Default",
          sku: "",
          priceModifier: 0,
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

  const { fields: supplierFields, append: appendSupplier, remove: removeSupplier } = useFieldArray({
    control: form.control,
    name: "suppliers",
  });

  // --- SWR Data Fetching ---
  const { data: locationsResult, error: locationsError, isLoading: isLoadingLocations } = useSWR<{data?: Location[], error?: string}>(
    '/api/warehouse',
    fetcher,{
      revalidateOnMount: true,
      revalidateOnFocus: false,
      shouldRetryOnError: true
    }
  );
  const storageLocations = locationsResult?.data ?? [];

  const { data: suppliersResult, error: suppliersError, isLoading: isLoadingSuppliers } = useSWR<{data?: Supplier[], error?: string }>(
    '/api/suppliers',
    fetcher,{
      revalidateOnMount: true,
      revalidateOnFocus: false,
      shouldRetryOnError: true
    }
  );
  const availableSuppliers = suppliersResult?.data ?? [];

  const {
    data: categoriesResult,
    error: categoriesError,
    isLoading: isLoadingCategories,
  } = useCategories()
  const categories = categoriesResult?.data || [];

  // --- Handlers ---
  const handleImageUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setGeneralError(null);
    try {
      //@ts-expect-error this is fine
      const url = await uploadSanityAsset(file, 'product-images', 'image');
      setImageUrls((prev) => [...prev, url]);
      form.setValue('imageUrls', [...imageUrls, url]);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Image upload failed:", error);
      setGeneralError("Image upload failed. Please try again.");
      toast.error("Image upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }, [imageUrls, form]);

  const removeImage = useCallback((urlToRemove: string) => {
    const newUrls = imageUrls.filter((url) => url !== urlToRemove);
    setImageUrls(newUrls);
    form.setValue('imageUrls', newUrls);
  }, [imageUrls, form]);

  // --- Variant Handlers ---
  const addVariant = () => {
    appendVariant({
      ...defaultVariant,
      name: `Variant ${variantFields.length + 1}`,
      sku: `${form.watch('sku')}-V${variantFields.length + 1}` || ''
    });
  };

  // --- Supplier Handlers ---
  const [selectedSupplierToAdd, setSelectedSupplierToAdd] = useState<string>('');

  const addProductSupplier = () => {
    if (!selectedSupplierToAdd) {
      toast.warning("Please select a supplier to add.");
      return;
    }
    
    const supplier = availableSuppliers.find(s => s.id === selectedSupplierToAdd);
    if (!supplier) return;

    appendSupplier({
      ...defaultProductSupplier,
      supplierId: selectedSupplierToAdd,
      isPreferred: supplierFields.length === 0,
    });
    setSelectedSupplierToAdd('');
  };

  const handlePreferredSupplierChange = (index: number) => {
    const currentSuppliers = form.getValues('suppliers');
    const updatedSuppliers = currentSuppliers?.map((supplier, i) => ({
      ...supplier,
      isPreferred: i === index
    }));
    form.setValue('suppliers', updatedSuppliers);
  };

  // --- Form Submission ---
  const onSubmit = async (values: ProductInput) => {
    setFormErrors({});
    setGeneralError(null);

    const formData = new FormData();

    // Append all simple values
    Object.entries(values).forEach(([key, value]) => {
      if (key === "variants" || key === "suppliers" || key === "imageUrls")
        return;
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Append complex data as JSON
    formData.append("variants", JSON.stringify(values.variants));
    formData.append("suppliers", JSON.stringify(values.suppliers));
    imageUrls.forEach((url) => formData.append("imageUrls", url));

    startTransition(async () => {
      try {
        const result = await addProduct(formData);

        if (result?.error) {
            setGeneralError(result.error);
          if (result.fieldErrors) {
            setFormErrors(result.fieldErrors);
            const firstErrorField = Object.keys(result.fieldErrors)[0];
            const element = document.getElementsByName(firstErrorField)[0];
            element?.focus();
            element?.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            setGeneralError(result.error);
          }
          toast.error(
            result.error || "Failed to add product. Please check errors."
          );
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

  // Effect to update the first variant's SKU when the main product SKU changes
  useEffect(() => {
    const productSku = form.watch('sku');
    const variants = form.getValues('variants');
    
    if (variants && variants?.length > 0 && !variants[0].sku && productSku) {
      form.setValue('variants.0.sku', productSku);
    }
  }, [form]);

  return (
    <ScrollArea className="container mx-auto p-4 space-y-6">
      <SectionHeader
        title="Product Management"
        subtitle="Manage your product catalog efficiently."
        icon={<PackagePlus className="h-8 w-8 text-indigo-500" />}
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

          {/* --- Basic Information --- */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the core details of your product.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Premium T-Shirt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product SKU *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., TSHIRT-PREM-BLK" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detailed description of the product..." {...field} />
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
                    <FormLabel>Product Barcode (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123456789012" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingCategories}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select Category..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingCategories && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                        {categoriesError && <SelectItem value="error" disabled>Error loading categories</SelectItem>}
                        {!isLoadingCategories && !categoriesError && categories.length === 0 && <SelectItem value="no-items" disabled>No categories found</SelectItem>}
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
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price ($) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="e.g., 29.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 md:col-span-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Product is Active</FormLabel>
                      <FormDescription>
                        Inactive products will not be visible or purchasable.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* --- Images --- */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>Upload images for your product. The first image is often used as the main display image.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="imageUrls"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                        {imageUrls.map((url) => (
                          <div key={url} className="relative aspect-square group">
                            <Image src={url} alt="Product image" fill className="rounded-md border object-cover" />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              onClick={() => removeImage(url)}
                              aria-label="Remove image"
                              disabled={isPending || isUploading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Label htmlFor="imageUpload" className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md transition-colors ${isUploading || isPending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary'}`}>
                          {isUploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          ) : (
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                          )}
                          <span className="mt-2 text-xs text-muted-foreground">{isUploading ? 'Uploading...' : 'Upload'}</span>
                          <Input
                            id="imageUpload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageUpload}
                            disabled={isUploading || isPending}
                          />
                        </Label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* --- Variants --- */}
          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <CardDescription>Define different versions (e.g., size, color). The first variant often represents the base product if no specific attributes differentiate it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {variantFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md relative space-y-4 bg-muted/20 dark:bg-muted/40">
                  {variantFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive z-10"
                      onClick={() => removeVariant(index)}
                      disabled={isPending}
                      aria-label="Remove variant"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <h4 className="font-medium text-sm mb-3">Variant #{index + 1}</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Variant Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Large Black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.sku`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Variant SKU *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., TSHIRT-PREM-BLK-L" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">Must be unique.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.barcode`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Barcode (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Variant specific barcode" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.priceModifier`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price Modifier ($) *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g., 5.00 or -2.00" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">Adjustment to base price. Use 0 if same as base.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.reorderPoint`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reorder Point *</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">Stock level to trigger alert.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.reorderQty`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reorder Quantity *</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" step="1" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">Typical quantity to reorder.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.isActive`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} id={`variant-isActive-${index}`}/>
                          </FormControl>
                          <FormLabel htmlFor={`variant-isActive-${index}`} className="text-sm font-medium !mt-0">Active</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.lowStockAlert`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} id={`variant-lowStockAlert-${index}`}/>
                          </FormControl>
                          <FormLabel htmlFor={`variant-lowStockAlert-${index}`} className="text-sm font-medium !mt-0">Low Stock Alert</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addVariant} disabled={isPending}>
                Add Variant
              </Button>
              {form.formState.errors.variants && typeof form.formState.errors.variants === 'object' && !Array.isArray(form.formState.errors.variants) && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.variants.message}</p>
              )}
            </CardContent>
          </Card>

          {/* --- Suppliers --- */}
          <Card>
            <CardHeader>
              <CardTitle>Suppliers</CardTitle>
              <CardDescription>Manage suppliers and their specific details for this product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-2 items-end p-4 border rounded-lg bg-muted/20 dark:bg-muted/40">
                <div className="flex-grow w-full sm:w-auto space-y-1">
                  <Label htmlFor="supplierSelect">Available Suppliers</Label>
                  <Select value={selectedSupplierToAdd} onValueChange={setSelectedSupplierToAdd} disabled={isLoadingSuppliers || isPending || availableSuppliers.length === 0}>
                    <SelectTrigger id="supplierSelect">
                      <SelectValue placeholder={
                        isLoadingSuppliers ? "Loading..." :
                        suppliersError ? "Error loading" :
                        availableSuppliers.length === 0 ? "No available suppliers" :
                        "Select a supplier to add"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingSuppliers && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                      {suppliersError && <SelectItem value="error" disabled>Error loading suppliers</SelectItem>}
                      {!isLoadingSuppliers && !suppliersError && availableSuppliers.length === 0 && <SelectItem value="no-suppliers" disabled>No suppliers found or all added</SelectItem>}
                      {availableSuppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {suppliersError && <p className="text-sm text-destructive mt-1">{suppliersError}</p>}
                </div>
                <Button
                  type="button"
                  onClick={addProductSupplier}
                  disabled={!selectedSupplierToAdd || isLoadingSuppliers || isPending}
                  className="w-full sm:w-auto"
                >
                  Add Supplier to Product
                </Button>
              </div>

              {supplierFields.length > 0 && <Separator />}
              <div className="space-y-4">
                {supplierFields.map((field, index) => {
                  const supplierDetails = availableSuppliers.find(s => s.id === field.supplierId);
                  return (
                    <div key={field.id} className="p-4 border rounded-md relative space-y-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive z-10"
                        onClick={() => removeSupplier(index)}
                        disabled={isPending}
                        aria-label="Remove supplier"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <h4 className="font-semibold">{supplierDetails?.name || `Supplier ID: ${field.supplierId}`}</h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <FormField
                          control={form.control}
                          name={`suppliers.${index}.supplierSku`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Supplier SKU</FormLabel>
                              <FormControl>
                                <Input placeholder="Supplier's product code" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`suppliers.${index}.costPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cost Price ($) *</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`suppliers.${index}.minimumOrderQuantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Min. Order Qty</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" step="1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`suppliers.${index}.packagingUnit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Packaging Unit</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Box of 12" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`suppliers.${index}.isPreferred`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 pt-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={() => handlePreferredSupplierChange(index)}
                                id={`isPreferred-${index}`}
                              />
                            </FormControl>
                            <Label htmlFor={`isPreferred-${index}`} className="text-sm font-medium">Preferred Supplier</Label>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
              </div>
              {form.formState.errors.suppliers && typeof form.formState.errors.suppliers === 'object' && !Array.isArray(form.formState.errors.suppliers) && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.suppliers.message}</p>
              )}
            </CardContent>
          </Card>

          {/* --- Physical Dimensions & Weight --- */}
          <Card>
            <CardHeader>
              <CardTitle>Physical Properties</CardTitle>
              <CardDescription>Enter dimensions and weight, primarily used for shipping calculations. Leave blank if not applicable.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-4 border p-4 rounded-md md:col-span-2 lg:col-span-1">
                <Label className="text-sm font-medium">Dimensions</Label>
                <div className="grid grid-cols-3 gap-2 items-end">
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel className="text-xs">Width</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" min="0" placeholder="W" {...field} value={field.value ?? ''}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel className="text-xs">Height</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" min="0" placeholder="H" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="depth"
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel className="text-xs">Depth</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" min="0" placeholder="D" {...field} value={field.value ?? ''}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <FormField
                control={form.control}
                name="dimensionUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dimension Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Weight</Label>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <Input type="number" step="any" min="0" placeholder="e.g., 0.5" {...field} value={field.value ?? ''}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weightUnit"
                    render={({ field }) => (
                      <FormItem className="w-[80px] flex-shrink-0">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unit"/>
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
              </div>

              <FormField
                control={form.control}
                name="volumetricWeight"
                render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-span-3">
                    <FormLabel>Volumetric Weight (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" min="0" placeholder="Calculated or specified volumetric weight" {...field} value={field.value ?? ''}/>
                    </FormControl>
                    <FormDescription>
                      Used by some carriers. Often calculated as (L x W x H) / Dim Factor. Uses same unit as Weight.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* --- Inventory & Location --- */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>Set overall product reorder level and default storage location.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="reorderPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Reorder Point *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Alert level for the product overall (variants have their own).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Storage Location *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingLocations}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingLocations ? "Loading locations..." : "Select default location"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingLocations && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                        {locationsError && <SelectItem value="error" disabled>Error loading locations</SelectItem>}
                        {!isLoadingLocations && !locationsError && storageLocations.length === 0 && <SelectItem value="no-items" disabled>No locations found</SelectItem>}
                        {storageLocations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Where newly received stock of this product typically goes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* --- Submission --- */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || isUploading}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isPending ? 'Adding Product...' : 'Add Product'}
            </Button>
          </div>

          {/* Display raw form errors for debugging if needed */}
          {Object.keys(form.formState.errors).length > 0 && process.env.NODE_ENV === 'development' && (
            <Alert variant="destructive" className="mt-6">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Validation Errors Detected (Dev Only)</AlertTitle>
              <AlertDescription>
                <pre className="mt-2 rounded-md bg-slate-950 p-4 overflow-x-auto">
                  <code className="text-white text-xs">{JSON.stringify(form.formState.errors, null, 2)}</code>
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </form>
      </Form>
    </ScrollArea>
  );
}

export default AddProductForm;