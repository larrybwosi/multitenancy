'use client';

import { useState, useTransition, useCallback, ChangeEvent } from 'react';
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
import { ProductInput, ProductSchema } from '@/lib/validations/product';
import { uploadSanityAsset } from '@/actions/uploads';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useCategories } from '@/lib/hooks/use-categories';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VariantModal } from './variant';

// --- Helper Types (Simulated Fetch Data) ---
interface Supplier {
  id: string;
  name: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AddProductForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [variantModalOpen, setVariantModalOpen] = useState(false);

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

  const { fields: supplierFields, remove: removeSupplier } = useFieldArray({
    control: form.control,
    name: "suppliers",
  });

  // --- SWR Data Fetching ---
  const { data: locationsResult, error: locationsError, isLoading: isLoadingLocations } = useSWR(
    '/api/warehouse',
    fetcher,{
      revalidateOnMount: true,
      revalidateOnFocus: false,
      shouldRetryOnError: true
    }
  );
  
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

  // --- Supplier Handlers ---
  const [selectedSupplierToAdd, setSelectedSupplierToAdd] = useState<string>('');

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

  return (
    <>
      <VariantModal
        open={variantModalOpen}
        onOpenChange={setVariantModalOpen}
        variants={form.watch('variants')}
        onAddVariant={(variant) => appendVariant(variant)}
        onRemoveVariant={removeVariant}
      />
      
      <ScrollArea className="container mx-auto p-4 space-y-6 py-4">
        <SectionHeader
          title="Create New Product"
          subtitle="Fill in the details to add a new product to your catalog."
          icon={<PackagePlus className="h-8 w-8 text-primary mt-2" />}
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
            <Card className="bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <CardTitle className="text-primary">Basic Information</CardTitle>
                <CardDescription>
                  Enter the core details of your product.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Premium T-Shirt" {...field} className="bg-background" />
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
                        <Textarea
                          placeholder="Detailed description of the product..."
                          {...field}
                          value={field.value || ""}
                          className="bg-background min-h-[100px]"
                        />
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
                        <Input
                          placeholder="e.g., 123456789012"
                          {...field}
                          value={field.value || ""}
                          className="bg-background"
                        />
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingCategories}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue
                              placeholder={
                                isLoadingCategories
                                  ? "Loading categories..."
                                  : "Select Category..."
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingCategories && (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                          )}
                          {categoriesError && (
                            <SelectItem value="error" disabled>
                              Error loading categories
                            </SelectItem>
                          )}
                          {!isLoadingCategories &&
                            !categoriesError &&
                            categories.length === 0 && (
                              <SelectItem value="no-items" disabled>
                                No categories found
                              </SelectItem>
                            )}
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
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g., 29.99"
                          {...field}
                          className="bg-background"
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
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 md:col-span-2 bg-background">
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
            <Card className="bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <CardTitle className="text-primary">Product Images</CardTitle>
                <CardDescription>
                  Upload images for your product. The first image is often used as
                  the main display image.
                </CardDescription>
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
                            <div
                              key={url}
                              className="relative aspect-square group"
                            >
                              <Image
                                src={url}
                                alt="Product image"
                                fill
                                className="rounded-md border object-cover"
                              />
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
                          <Label
                            htmlFor="imageUpload"
                            className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md transition-colors ${isUploading || isPending ? "cursor-not-allowed opacity-50 bg-background" : "cursor-pointer hover:border-primary bg-background"}`}
                          >
                            {isUploading ? (
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            ) : (
                              <UploadCloud className="h-8 w-8 text-muted-foreground" />
                            )}
                            <span className="mt-2 text-xs text-muted-foreground">
                              {isUploading ? "Uploading..." : "Upload"}
                            </span>
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
            <Card className="bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <CardTitle className="text-primary">Variants</CardTitle>
                <CardDescription>
                  Define different versions (e.g., size, color). The first variant
                  often represents the base product if no specific attributes
                  differentiate it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {variantFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 border rounded-md relative space-y-4 bg-background"
                    >
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
                      <h4 className="font-medium text-sm mb-3 text-primary">
                        {field.name}
                      </h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <Label>Reorder Point</Label>
                          <p className="text-sm">{field.reorderPoint}</p>
                        </div>
                        <div>
                          <Label>Reorder Quantity</Label>
                          <p className="text-sm">{field.reorderQty}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            checked={field.isActive} 
                            disabled 
                            className="h-4 w-4"
                          />
                          <Label>Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            checked={field.lowStockAlert} 
                            disabled 
                            className="h-4 w-4"
                          />
                          <Label>Low Stock Alert</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVariantModalOpen(true)}
                  disabled={isPending}
                  className="w-full"
                >
                  Manage Variants
                </Button>
                {form.formState.errors.variants &&
                  typeof form.formState.errors.variants === "object" &&
                  !Array.isArray(form.formState.errors.variants) && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.variants.message}
                    </p>
                  )}
              </CardContent>
            </Card>

            {/* --- Suppliers --- */}
            <Card className="bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <CardTitle className="text-primary">Suppliers</CardTitle>
                <CardDescription>
                  Manage suppliers and their specific details for this product.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-2 items-end p-4 border rounded-lg bg-background">
                  <div className="flex-grow w-full sm:w-auto space-y-1">
                    <Label htmlFor="supplierSelect">Available Suppliers</Label>
                    <Select
                      value={selectedSupplierToAdd}
                      onValueChange={setSelectedSupplierToAdd}
                      disabled={
                        isLoadingSuppliers ||
                        isPending ||
                        availableSuppliers.length === 0
                      }
                    >
                      <SelectTrigger id="supplierSelect" className="bg-background">
                        <SelectValue
                          placeholder={
                            isLoadingSuppliers
                              ? "Loading..."
                              : suppliersError
                                ? "Error loading"
                                : availableSuppliers.length === 0
                                  ? "No available suppliers"
                                  : "Select a supplier to add"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingSuppliers && (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        )}
                        {suppliersError && (
                          <SelectItem value="error" disabled>
                            Error loading suppliers
                          </SelectItem>
                        )}
                        {!isLoadingSuppliers &&
                          !suppliersError &&
                          availableSuppliers.length === 0 && (
                            <SelectItem value="no-suppliers" disabled>
                              No suppliers found or all added
                            </SelectItem>
                          )}
                        {availableSuppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {suppliersError && (
                      <p className="text-sm text-destructive mt-1">
                        {suppliersError}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => router.push('/suppliers/add')}
                    disabled={isLoadingSuppliers || isPending}
                    className="w-full sm:w-auto"
                    variant="secondary"
                  >
                    Add New Supplier
                  </Button>
                </div>

                {supplierFields.length > 0 && <Separator />}
                <div className="space-y-4">
                  {supplierFields.map((field, index) => {
                    const supplierDetails = availableSuppliers.find(
                      (s) => s.id === field.supplierId
                    );
                    return (
                      <div
                        key={field.id}
                        className="p-4 border rounded-md relative space-y-4 bg-background"
                      >
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
                        <h4 className="font-semibold text-primary">
                          {supplierDetails?.name ||
                            `Supplier ID: ${field.supplierId}`}
                        </h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <FormField
                            control={form.control}
                            name={`suppliers.${index}.costPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cost Price ($) *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...field}
                                    className="bg-background"
                                  />
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
                                  <Input
                                    type="number"
                                    min="1"
                                    step="1"
                                    {...field}
                                    className="bg-background"
                                  />
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
                                  <Input
                                    placeholder="e.g., Box of 12"
                                    {...field}
                                    className="bg-background"
                                  />
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
                                  onCheckedChange={() =>
                                    handlePreferredSupplierChange(index)
                                  }
                                  id={`isPreferred-${index}`}
                                  className="bg-background"
                                />
                              </FormControl>
                              <Label
                                htmlFor={`isPreferred-${index}`}
                                className="text-sm font-medium"
                              >
                                Preferred Supplier
                              </Label>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
                {form.formState.errors.suppliers &&
                  typeof form.formState.errors.suppliers === "object" &&
                  !Array.isArray(form.formState.errors.suppliers) && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.suppliers.message}
                    </p>
                  )}
              </CardContent>
            </Card>

            {/* --- Physical Dimensions & Weight --- */}
            <Card className="bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <CardTitle className="text-primary">Physical Properties</CardTitle>
                <CardDescription>
                  Enter dimensions and weight, primarily used for shipping
                  calculations. Leave blank if not applicable.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-4 border p-4 rounded-md md:col-span-2 lg:col-span-1 bg-background">
                  <Label className="text-sm font-medium">Dimensions</Label>
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <FormField
                      control={form.control}
                      name="width"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel className="text-xs">Width</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="W"
                              {...field}
                              value={field.value ?? ""}
                              className="bg-background"
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
                        <FormItem className="col-span-1">
                          <FormLabel className="text-xs">Height</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="H"
                              {...field}
                              value={field.value ?? ""}
                              className="bg-background"
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
                        <FormItem className="col-span-1">
                          <FormLabel className="text-xs">Length</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="L"
                              {...field}
                              value={field.value ?? ""}
                              className="bg-background"
                            />
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
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
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="e.g., 0.5"
                              {...field}
                              value={field.value ?? ""}
                              className="bg-background"
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
                        <FormItem className="w-[80px] flex-shrink-0">
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Unit" />
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
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="Calculated or specified volumetric weight"
                          {...field}
                          value={field.value ?? ""}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormDescription>
                        Used by some carriers. Often calculated as (L x W x H) /
                        Dim Factor. Uses same unit as Weight.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* --- Inventory & Location --- */}
            <Card className="bg-gradient-to-br from-background to-muted/20">
              <CardHeader>
                <CardTitle className="text-primary">Inventory</CardTitle>
                <CardDescription>
                  Set overall product reorder level and default storage location.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="reorderPoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Reorder Point *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="1" 
                          {...field} 
                          className="bg-background"
                        />
                      </FormControl>
                      <FormDescription>
                        Alert level for the product overall (variants have their
                        own).
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingLocations}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue
                              placeholder={
                                isLoadingLocations
                                  ? "Loading locations..."
                                  : "Select default location"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingLocations && (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                          )}
                          {locationsError && (
                            <SelectItem value="error" disabled>
                              Error loading locations
                            </SelectItem>
                          )}
                          {!isLoadingLocations &&
                            !locationsError &&
                            locationsResult?.length === 0 && (
                              <SelectItem value="no-items" disabled>
                                No locations found
                              </SelectItem>
                            )}
                            {/* @ts-expect-error just fine for now */}
                          {locationsResult?.map((loc) => (
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
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isUploading}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isPending ? "Adding Product..." : "Add Product"}
              </Button>
            </div>

            {/* Display raw form errors for debugging if needed */}
            {Object.keys(form.formState.errors).length > 0 &&
              process.env.NODE_ENV === "development" && (
                <Alert variant="destructive" className="mt-6">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Validation Errors Detected (Dev Only)</AlertTitle>
                  <AlertDescription>
                    <pre className="mt-2 rounded-md bg-slate-950 p-4 overflow-x-auto">
                      <code className="text-white text-xs">
                        {JSON.stringify(form.formState.errors, null, 2)}
                      </code>
                    </pre>
                  </AlertDescription>
                </Alert>
              )}
          </form>
        </Form>
      </ScrollArea>
    </>
  );
}