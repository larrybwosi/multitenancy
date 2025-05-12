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
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddProductSupplier, useUpdateProductSupplier } from '@/lib/hooks/use-product-detail';
import { ProductSupplierSchema } from '@/lib/validations/product';
import { useState } from 'react';

type FormData = z.infer<typeof ProductSupplierSchema>;

interface Supplier {
  id: string;
  name: string;
}

interface ProductVariant {
  id: string;
  name: string;
}

interface ProductSupplier {
  id: string;
  productId: string;
  supplierId: string;
  supplierSku?: string | null;
  costPrice: number | string;
  minimumOrderQuantity?: number | null;
  packagingUnit?: string | null;
  isPreferred: boolean;
}

interface AddEditSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productSupplier: ProductSupplier | null;
  productId: string;
  variants: ProductVariant[];
  suppliers: Supplier[];
}

export default function AddEditSupplierModal({
  open,
  onOpenChange,
  productSupplier,
  productId,
  variants,
  suppliers
}: AddEditSupplierModalProps) {
  const isEditing = !!productSupplier;
  const updateSupplierMutation = useUpdateProductSupplier();
  const addSupplierMutation = useAddProductSupplier();
  const isLoading = updateSupplierMutation.isPending || addSupplierMutation.isPending;

  // Initialize form with default values or existing supplier data
  const form = useForm<FormData>({
    resolver: zodResolver(ProductSupplierSchema),
    defaultValues: productSupplier
      ? {
          supplierId: productSupplier.supplierId,
          supplierSku: productSupplier.supplierSku || null,
          costPrice: typeof productSupplier.costPrice === 'string' ? 
            parseFloat(productSupplier.costPrice) : 
            productSupplier.costPrice,
          minimumOrderQuantity: productSupplier.minimumOrderQuantity || null,
          packagingUnit: productSupplier.packagingUnit || null,
          isPreferred: productSupplier.isPreferred,
        }
      : {
          supplierId: '',
          supplierSku: null,
          costPrice: 0,
          minimumOrderQuantity: null,
          packagingUnit: null,
          isPreferred: false,
        },
  });

  // Define selected variant ID - either from editing or use first variant
  const [selectedVariantId, setSelectedVariantId] = useState(
    productSupplier?.productId || (variants && variants.length > 0 ? variants[0].id : '')
  );

  const onSubmit = (data: FormData) => {
    if (isEditing && productSupplier) {
      updateSupplierMutation.mutate({
        ...data,
        id: productSupplier.id,
        productId: productId
      });
    } else {
      addSupplierMutation.mutate({
        ...data,
        productId: selectedVariantId,
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
            {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the supplier details for this product variant.'
              : 'Add a new supplier for this product variant.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {!isEditing && variants.length > 0 && (
                <FormItem className="col-span-2">
                  <FormLabel>Select Variant</FormLabel>
                  <Select 
                    defaultValue={selectedVariantId} 
                    onValueChange={(value) => setSelectedVariantId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a variant" />
                    </SelectTrigger>
                    <SelectContent>
                      {variants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
              
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
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
                name="supplierSku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier SKU (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Supplier's SKU" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price ($)</FormLabel>
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
                name="minimumOrderQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Order Quantity (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        {...field} 
                        value={field.value === null ? '' : field.value} 
                        onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="packagingUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Packaging Unit (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Case of 12, Pallet" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="isPreferred"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Preferred Supplier</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                {isEditing ? 'Update Supplier' : 'Add Supplier'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 