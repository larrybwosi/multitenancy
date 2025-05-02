import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ChangeEvent } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, ImagePlus } from 'lucide-react';
import { useCreateProduct } from '@/lib/hooks/use-products';

// Schema definition
const BaseProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  buyingPrice: z.coerce.number().positive('Price must be positive'),
  sku: z.string().min(1, 'SKU is required').nullable(),
  barcode: z.string().nullable(),
  retailPrice: z.coerce.number().nonnegative('Retail price must be non-negative').nullable(),
  wholesalePrice: z.coerce.number().nonnegative('Wholesale price must be non-negative').nullable(),
  imageUrls: z.array(z.string()).default([]),
  reorderPoint: z.coerce.number().int().positive('Reorder point must be positive'),
  isActive: z.boolean().default(true),
});

export const AddProductMinimalSchema = BaseProductSchema.extend({
  sku: BaseProductSchema.shape.sku.optional(),
  barcode: BaseProductSchema.shape.barcode.optional(),
  retailPrice: BaseProductSchema.shape.retailPrice.optional(),
  wholesalePrice: BaseProductSchema.shape.wholesalePrice.optional(),
  imageUrls: BaseProductSchema.shape.imageUrls.optional(),
  reorderPoint: BaseProductSchema.shape.reorderPoint.optional(),
  isActive: BaseProductSchema.shape.isActive.optional(),
});

type ProductFormValues = z.infer<typeof AddProductMinimalSchema>;

interface CreateProductModalProps {
  categories: { id: string; name: string }[];
}

export function CreateProductModal({ categories }: CreateProductModalProps) {
  const [open, setOpen] = useState(false);

  const {
    mutateAsync: createProductMutation,
    isPending: creatingProduct,
  } = useCreateProduct();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(AddProductMinimalSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      sku: null,
      barcode: null,
      retailPrice: null,
      wholesalePrice: null,
      imageUrls: [],
      reorderPoint: 5,
      isActive: true,
    },
  });


  const onSubmit = async(data: ProductFormValues) => {
    await createProductMutation(data);
  };

  const handleNumberInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: { onChange: (value: number | null) => void }
  ) => {
    const value = e.target.value;
    field.onChange(value === '' ? null : Number(value));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Product</DialogTitle>
          <DialogDescription className="text-muted-foreground flex flex-wrap gap-2 mt-2">
            Add your product details to inventory
            <div className="w-full flex flex-wrap gap-2 mt-1">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Required Fields
              </Badge>
              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                Optional Fields
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium flex items-center gap-2">
                      Product Name
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-normal">
                        Required
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
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
                    <FormLabel className="font-medium flex items-center gap-2">
                      Category
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-normal">
                        Required
                      </Badge>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="buyingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium flex items-center gap-2">
                      Buying Price
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-normal">
                        Required
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value}
                        onChange={e => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Cost price per unit</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="retailPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Retail Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value ?? ''}
                        onChange={e => handleNumberInputChange(e, field)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Sales price to customers</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wholesalePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Wholesale Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value ?? ''}
                        onChange={e => handleNumberInputChange(e, field)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Bulk sales price</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">SKU</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Stock Keeping Unit"
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Leave empty for auto-generation</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Barcode</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="UPC, EAN, etc."
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reorderPoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Reorder Point</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="5"
                      value={field.value}
                      onChange={e => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Stock level at which to reorder this product</FormDescription>
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
                    <FormLabel className="font-medium">Active Status</FormLabel>
                    <FormDescription>Make this product visible and available for sale</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* <FormField
              control={form.control}
              name="imageUrls"
              render={() => (
                <FormItem>
                  <FormLabel className="font-medium">Images</FormLabel>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="dropzone-file"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImagePlus className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-1 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">Images will appear here</p>
                      </div>
                      <input id="dropzone-file" type="file" className="hidden" multiple />
                    </label>
                  </div>
                  <FormDescription className="text-xs">Product images will be displayed in the catalog</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="mt-2 sm:mt-0">
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 mt-2 sm:mt-0"
                disabled={creatingProduct}
              >
                {creatingProduct ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Product'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
