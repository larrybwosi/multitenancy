'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAddVariant, useUpdateVariant } from '@/lib/hooks/use-product-detail';
import { ProductVariantSchema } from '@/lib/validations/product';
import { Badge } from '@/components/ui/badge';

type FormData = z.infer<typeof ProductVariantSchema>;

interface AddEditVariantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: any | null;
  productId: string;
}

export default function AddEditVariantModal({
  open,
  onOpenChange,
  variant,
  productId
}: AddEditVariantModalProps) {
  const isEditing = !!variant;
  const updateVariantMutation = useUpdateVariant();
  const addVariantMutation = useAddVariant();
  const isLoading = updateVariantMutation.isPending || addVariantMutation.isPending;

  const form = useForm<Forata>({
    resolver: zodResolver(ProductVariantSchema),
    defaultValues: variant
      ? {
          name: variant.name,
          sku: variant.sku,
          barcode: variant.barcode || null,
          buyingPrice: parseFloat(variant.buyingPrice.toString()),
          retailPrice: variant.retailPrice ? parseFloat(variant.retailPrice.toString()) : null,
          wholesalePrice: variant.wholesalePrice ? parseFloat(variant.wholesalePrice.toString()) : null,
          attributes: variant.attributes || null,
          isActive: variant.isActive,
          reorderPoint: variant.reorderPoint,
          reorderQty: variant.reorderQty,
          lowStockAlert: variant.lowStockAlert,
        }
      : {
          name: '',
          sku: '',
          barcode: null,
          retailPrice: null,
          wholesalePrice: null,
          attributes: null,
          isActive: true,
          reorderPoint: 5,
          reorderQty: 10,
          lowStockAlert: false,
        },
  });

  const onSubmit = async(data: FormData) => {
    if (isEditing && variant) {
      await updateVariantMutation.mutateAsync({
        ...data,
        id: variant.id,
      });
    } else {
      console.log(data)
      await addVariantMutation.mutateAsync({
        ...data,
        productId: productId,
      });
    }
    
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Edit
                </Badge>
                <span>Variant Details</span>
              </>
            ) : (
              <>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  New
                </Badge>
                <span>Add Variant</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details for this product variant. Changes will be reflected immediately.'
              : 'Create a new variant for this product. Fill in all required fields.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Name
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Red / Large / 500ml" {...field} />
                    </FormControl>
                    <FormDescription>
                      Descriptive name for this variant (color, size, etc.)
                    </FormDescription>
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
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="SKU-123456" {...field} />
                    </FormControl>
                    <FormDescription>
                      Unique stock keeping unit identifier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789012" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      Optional barcode (UPC, EAN, etc.)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="buyingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Cost Price
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-sm text-gray-500">$</span>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          className="pl-8"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your cost to purchase this item
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="retailPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retail Price</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-sm text-gray-500">$</span>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          className="pl-8"
                          {...field} 
                          value={field.value === null ? '' : field.value} 
                          onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Selling price to individual customers
                    </FormDescription>
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
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-sm text-gray-500">$</span>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          className="pl-8"
                          {...field} 
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Bulk pricing for resellers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reorderPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Reorder Point
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">Inventory</Badge>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      When stock reaches this level, reorder
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reorderQty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Reorder Quantity
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">Inventory</Badge>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Default quantity to reorder
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel className="font-medium">Active</FormLabel>
                        <FormDescription className="text-xs">
                          {field.value ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Visible to customers
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-700">
                              Hidden from customers
                            </Badge>
                          )}
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="lowStockAlert"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-orange-500"
                        />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel className="font-medium">Low Stock Alert</FormLabel>
                        <FormDescription className="text-xs">
                          {field.value ? (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700">
                              Alerts enabled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-700">
                              Alerts disabled
                            </Badge>
                          )}
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Variant' : 'Add Variant'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}