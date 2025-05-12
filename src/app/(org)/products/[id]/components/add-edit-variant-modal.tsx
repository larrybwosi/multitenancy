'use client';

import { useState } from 'react';
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
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAddVariant, useUpdateVariant } from '@/lib/hooks/use-product-detail';
import { ProductVariantSchema } from '@/lib/validations/product';

type FormData = z.infer<typeof ProductVariantSchema>;

interface AddEditVariantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: any | null;
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

  // Initialize form with default values or existing variant data
  const form = useForm<FormData>({
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
          buyingPrice: 0,
          retailPrice: null,
          wholesalePrice: null,
          attributes: null,
          isActive: true,
          reorderPoint: 5,
          reorderQty: 10,
          lowStockAlert: false,
        },
  });

  const onSubmit = (data: FormData) => {
    if (isEditing && variant) {
      updateVariantMutation.mutate({
        ...data,
        id: variant.id,
      });
    } else {
      addVariantMutation.mutate({
        ...data,
        productId: productId,
      });
    }
    
    // Close the dialog on successful mutation
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Variant' : 'Add New Variant'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details for this product variant.'
              : 'Create a new variant for this product.'}
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
                    <FormLabel>Variant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Red / Large" {...field} />
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
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU-123456" {...field} />
                    </FormControl>
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
                    <FormLabel>Barcode (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789012" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="buyingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buying Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
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
                    <FormLabel>Retail Price ($) (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        {...field} 
                        value={field.value === null ? '' : field.value} 
                        onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                      />
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
                    <FormLabel>Wholesale Price ($) (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        {...field} 
                        value={field.value === null ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                      />
                    </FormControl>
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
                    <FormLabel>Reorder Point</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reorderQty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Active</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lowStockAlert"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Low Stock Alert</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
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