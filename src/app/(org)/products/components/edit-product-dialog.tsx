import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ImagePlus, Trash2, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUpdateProduct } from '@/lib/hooks/use-products';
import { QRUploadModal } from '@/components/file-upload-device';
import Image from 'next/image';

// Types from your schema
type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  description?: string | null;
  sku: string;
  barcode?: string | null;
  categoryId: string;
  isActive: boolean;
  imageUrls?: string[];
};

type ProductWithRelations = Product & {
  category: { id: string; name: string } | null;
  variants?: {
    id: string;
    name: string;
    [key: string]: unknown;
  }[];
  _count?: { stockBatches?: number };
  totalStock: number;
  basePrice?: string | number;
  retailPrice?: number | null;
  wholesalePrice?: number | null;
  buyingPrice?: number | null;
  sellingPrice?: number | null;
  defaultLocation?: { id: string; name: string } | null;
  reorderPoint?: number | null;
};

// Zod schema for product editing
const EditProductFormSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional().nullable(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  buyingPrice: z.coerce.number().min(0, 'Buying price must be non-negative'),
  retailPrice: z.coerce.number().min(0, 'Retail price must be non-negative'),
  wholesalePrice: z.coerce.number().min(0, 'Wholesale price must be non-negative'),
  reorderPoint: z.coerce.number().int().min(0, 'Reorder point must be non-negative'),
  isActive: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).optional(),
});

export type EditProductFormData = z.infer<typeof EditProductFormSchema>;

interface EditProductDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: ProductWithRelations | null;
  categories: Category[];
  onClose?: () => void;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export const EditProductDialog = ({
  isOpen,
  setIsOpen,
  product,
  categories,
  onClose,
  onSuccess,
  onError,
}: EditProductDialogProps) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isUploading, setIsUploading] = useState(false);
  const { mutateAsync: updateProduct, isPending: updatingProduct } = useUpdateProduct();

  // Initialize the form with product data
  const form = useForm<EditProductFormData>({
    resolver: zodResolver(EditProductFormSchema),
    defaultValues: product
      ? {
          id: product.id,
          name: product.name,
          description: product.description ?? '',
          sku: product.sku,
          barcode: product.barcode ?? '',
          categoryId: product.category?.id || '',
          buyingPrice: product.buyingPrice ?? 0,
          retailPrice: product.retailPrice ?? 0,
          wholesalePrice: product.wholesalePrice ?? 0,
          reorderPoint: product.reorderPoint ?? 0,
          isActive: product.isActive,
          imageUrls: product.imageUrls ?? [],
        }
      : {
          id: '',
          name: '',
          description: '',
          sku: '',
          barcode: '',
          categoryId: '',
          buyingPrice: 0,
          retailPrice: 0,
          wholesalePrice: 0,
          reorderPoint: 0,
          isActive: true,
          imageUrls: [],
        },
  });

  // Handle form submission with only changed fields
  const handleSubmit = async (data: EditProductFormData) => {
    try {
      const changedData: Partial<EditProductFormData> = {};
      Object.keys(form.formState.dirtyFields).forEach(key => {
        if (form.formState.dirtyFields[key as keyof EditProductFormData]) {
          changedData[key as keyof EditProductFormData] = data[key as keyof EditProductFormData];
        }
      });
      // Always include the ID
      changedData.id = data.id;
      console.log('Submitting changed product data:', changedData);
      await updateProduct(changedData);
      onSuccess?.();
      setIsOpen(false);
      form.reset(data); // Reset form with submitted data to clear dirty state
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to update product');
    }
  };

  // Handle image upload via file input
  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const data = await response.json();
      const imageUrl = data.url;
      const currentImages = form.getValues('imageUrls') ?? [];
      form.setValue('imageUrls', [...currentImages, imageUrl], { shouldDirty: true });
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image upload from QRUploadModal
  const handleQRImageUpload = async (imageUrl: string) => {
    const currentImages = form.getValues('imageUrls') ?? [];
    form.setValue('imageUrls', [...currentImages, imageUrl], { shouldDirty: true });
  };

  // Remove an image
  const removeImage = (index: number) => {
    const currentImages = form.getValues('imageUrls') ?? [];
    form.setValue(
      'imageUrls',
      currentImages.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsOpen(false);
    form.reset();
    onClose?.();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Edit Product: {product.name}</DialogTitle>
          <DialogDescription className="text-gray-600">
            Update your product details below. Required fields are marked with a{' '}
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
              Required
            </Badge>{' '}
            badge, while optional fields are marked with{' '}
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
              Optional
            </Badge>
            .
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-4 bg-white shadow-sm rounded-lg">
                <TabsTrigger value="general" className="text-sm font-medium">
                  General Info
                </TabsTrigger>
                <TabsTrigger value="pricing" className="text-sm font-medium">
                  Pricing & Stock
                </TabsTrigger>
                <TabsTrigger value="images" className="text-sm font-medium">
                  Images
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Product Name
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                            Required
                          </Badge>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter product name" />
                        </FormControl>
                        <FormDescription>Name of the product as it will appear in listings.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Category
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                            Required
                          </Badge>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
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
                        <FormDescription>Choose the category this product belongs to.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          SKU
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                            Required
                          </Badge>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter Stock Keeping Unit" />
                        </FormControl>
                        <FormDescription>Unique identifier for inventory tracking.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Barcode
                          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 text-xs">
                            Optional
                          </Badge>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter UPC, EAN, etc." value={field.value ?? ''} />
                        </FormControl>
                        <FormDescription>Barcode for scanning at point of sale.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel className="flex items-center gap-2">
                          Description
                          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 text-xs">
                            Optional
                          </Badge>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe your product in detail"
                            className="min-h-32 resize-none"
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription>Provide a detailed description for customers.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            Active Status
                            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 text-xs">
                              Optional
                            </Badge>
                          </FormLabel>
                          <FormDescription>Enable to make this product visible and available for sale.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                <Card className="bg-white shadow-sm">
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="buyingPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Buying Price
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                Required
                              </Badge>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                            </FormControl>
                            <FormDescription>Cost to acquire each unit of the product.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="retailPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Retail Price
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                Required
                              </Badge>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                            </FormControl>
                            <FormDescription>Selling price to individual customers.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="wholesalePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Wholesale Price
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                Required
                              </Badge>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                            </FormControl>
                            <FormDescription>Price for bulk sales to distributors.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reorderPoint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Reorder Point
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                Required
                              </Badge>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" placeholder="0" />
                            </FormControl>
                            <FormDescription>Stock level at which to reorder the product.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-4 p-4 bg-slate-50 rounded-lg shadow-inner">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Current Stock:</span>
                        <span className="font-semibold text-gray-900">{product.totalStock}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-medium text-gray-700">Stock Batches:</span>
                        <span className="font-semibold text-gray-900">{product._count?.stockBatches ?? 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="images" className="space-y-4">
                <Card className="bg-white shadow-sm">
                  <CardContent className="pt-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="imageUrls"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Product Images
                            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 text-xs">
                              Optional
                            </Badge>
                          </FormLabel>
                          <div className="flex flex-wrap gap-4">
                            {field.value?.map((url, index) => (
                              <div key={index} className="relative group w-24 h-24 rounded-md overflow-hidden border">
                                <Image
                                  src={url}
                                  alt={`Product image ${index + 1} for ${product.name}`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 100px"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label={`Remove image ${index + 1}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <label
                                htmlFor="image-upload"
                                className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-md text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors cursor-pointer"
                              >
                                <input
                                  id="image-upload"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={isUploading}
                                  onChange={async e => {
                                    if (e.target.files?.[0]) {
                                      await handleImageUpload(e.target.files[0]);
                                    }
                                  }}
                                />
                                {isUploading ? (
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                  <>
                                    <ImagePlus className="h-6 w-6" />
                                    <span className="text-xs mt-1">Add Image</span>
                                  </>
                                )}
                              </label>
                              <QRUploadModal
                                onImageUploaded={handleQRImageUpload}
                                trigger={
                                  <Button
                                    variant="outline"
                                    type="button"
                                    disabled={isUploading}
                                    className="w-24 h-24 flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
                                  >
                                    {isUploading ? (
                                      <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                      <>
                                        <Smartphone className="h-6 w-6" />
                                        <span className="text-xs mt-1">From Phone</span>
                                      </>
                                    )}
                                  </Button>
                                }
                              />
                            </div>
                          </div>
                          <FormDescription>
                            Upload images to showcase your product in the catalog. Use the file picker or scan a QR code
                            to upload from your phone.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Separator />

            <DialogFooter className="flex justify-between sm:justify-between gap-2">
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatingProduct || isUploading || !form.formState.isDirty}
                className="min-w-24 bg-indigo-600 hover:bg-indigo-700"
              >
                {updatingProduct || isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
