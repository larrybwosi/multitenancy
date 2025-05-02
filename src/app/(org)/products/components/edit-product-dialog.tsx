import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ImagePlus, Trash2 } from 'lucide-react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useUpdateProduct } from '@/lib/hooks/use-products';
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
  id: z.string().cuid(), // ID is required for update
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
  product: ProductWithRelations | null; // Product to edit
  categories: Category[];
  onClose?: () => void; // Callback when dialog closes
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
  // onError,
}: EditProductDialogProps) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isUploading, setIsUploading] = useState(false);
  const { mutateAsync: updateProduct, isPending: updatingProduct } = useUpdateProduct();


  // Initialize the form with product data
  const form = useForm({
    resolver: zodResolver(EditProductFormSchema),
    defaultValues: product
      ? {
          id: product.id,
          name: product.name,
          description: product.description,
          sku: product.sku,
          barcode: product.barcode,
          categoryId: product.category?.id || '',
          buyingPrice: product.buyingPrice || 0,
          retailPrice: product.retailPrice || 0,
          wholesalePrice: product.wholesalePrice || 0,
          reorderPoint: product.reorderPoint || 0,
          isActive: product.isActive,
          imageUrls: product.imageUrls || [],
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


  const handleSubmit = (data: EditProductFormData) => {
    updateProduct(data);
    onSuccess?.();
  };

  // Mock image upload function
  const handleImageUpload = () => {
    setIsUploading(true);
    // In a real app, you would handle file upload here
    setTimeout(() => {
      const currentImages = form.getValues('imageUrls') || [];
      const newImageUrl = `https://cdn.sanity.io/images/7rkl59hi/production/50a6253c2e2e74c144c9953f2ae121970df1f611-612x348.png?fm=webp&q=75&auto=format`;
      form.setValue('imageUrls', [...currentImages, newImageUrl]);
      setIsUploading(false);
    }, 1500);
  };

  const removeImage = (index: number) => {
    const currentImages = form.getValues('imageUrls') || [];
    const newImages = [...currentImages];
    newImages.splice(index, 1);
    form.setValue('imageUrls', newImages);
  };

  const handleDialogClose = () => {
    setIsOpen(false);
    form.reset();
    onClose?.();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Product: {product.name}</DialogTitle>
          <DialogDescription>Make changes to the product details and save to update.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="general">General Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter product name" />
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
                        <FormLabel>Category</FormLabel>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Product SKU" />
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
                        <FormLabel>Barcode (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Product barcode" value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter product description"
                            className="min-h-32 resize-none"
                            value={field.value || ''}
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Active Status</FormLabel>
                          <FormDescription>Disable to hide this product from listings</FormDescription>
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
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="buyingPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Buying Price</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="retailPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Retail Price</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="wholesalePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Wholesale Price</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                            </FormControl>
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
                              <Input {...field} type="number" min="0" placeholder="0" />
                            </FormControl>
                            <FormDescription>Minimum stock level before reordering</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Current Stock:</span>
                        <span className="font-semibold">{product.totalStock}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-medium">Stock Batches:</span>
                        <span className="font-semibold">{product._count?.stockBatches || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="images" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    {form.watch('imageUrls')?.map((url, index) => (
                      <div key={index} className="relative group w-24 h-24 rounded-md overflow-hidden border">
                        <Image src={url} alt={`Product image ${index + 1}`} fill className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={isUploading}
                      className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-md text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
                    >
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <>
                          <ImagePlus className="h-6 w-6" />
                          <span className="text-xs mt-1">Add Image</span>
                        </>
                      )}
                    </button>
                  </div>
                  <FormMessage>{form.formState.errors.imageUrls?.message}</FormMessage>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <DialogFooter className="flex justify-between sm:justify-between gap-2">
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatingProduct || !form.formState.isDirty}
                className="min-w-24"
              >
                {updatingProduct ? (
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
