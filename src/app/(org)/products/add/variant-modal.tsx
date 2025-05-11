// components/ProductVariantModal.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { ProductVariantSchema } from '@/lib/validations/product';

type ProductVariantFormValues = z.infer<typeof ProductVariantSchema>;

// Add missing fields that are used in the form but not in the schema
interface ExtendedProductVariantFormValues extends ProductVariantFormValues {
  priceModifierType?: string;
  priceModifier?: number;
  stockQuantity?: number;
}

interface ProductVariantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
  variant?: (ExtendedProductVariantFormValues & { index?: number }) | null;
  onSave: (data: ProductVariantFormValues, index?: number) => void;
}

export function ProductVariantModal({
  open,
  onOpenChange,
  productName,
  variant,
  onSave,
}: ProductVariantModalProps) {
  const form = useForm<ExtendedProductVariantFormValues>({
    resolver: zodResolver(ProductVariantSchema),
    defaultValues: {
      id: undefined,
      name: '',
      sku: null,
      barcode: null,
      buyingPrice: 0,
      retailPrice: null,
      wholesalePrice: null,
      stockQuantity: 0,
      priceModifierType: 'fixed',
      priceModifier: 0,
      imageUrls: [],
      isActive: true,
      attributes: null,
      weight: null,
      weightUnit: 'WEIGHT_KG',
      reorderPoint: 5,
      reorderQty: 10,
      lowStockAlert: false
    },
  });

  useEffect(() => {
    if (variant) {
      form.reset({
        ...variant,
        id: variant.id,
        sku: variant.sku ?? null,
        barcode: variant.barcode ?? null,
        buyingPrice: variant.buyingPrice ?? 0,
        retailPrice: variant.retailPrice ?? null,
        wholesalePrice: variant.wholesalePrice ?? null,
        stockQuantity: variant.stockQuantity ?? 0,
        priceModifierType: variant.priceModifierType ?? 'fixed',
        priceModifier: variant.priceModifier ?? 0,
        attributes: variant.attributes ?? null,
        weight: variant.weight ?? null,
        weightUnit: variant.weightUnit ?? 'WEIGHT_KG',
        reorderPoint: variant.reorderPoint ?? 5,
        reorderQty: variant.reorderQty ?? 10,
        lowStockAlert: variant.lowStockAlert ?? false
      });
    } else {
      form.reset({
        id: undefined,
        name: '',
        sku: null,
        barcode: null,
        buyingPrice: 0,
        retailPrice: null,
        wholesalePrice: null,
        stockQuantity: 0,
        priceModifierType: 'fixed',
        priceModifier: 0,
        imageUrls: [],
        isActive: true,
        attributes: null,
        weight: null,
        weightUnit: 'WEIGHT_KG',
        reorderPoint: 5,
        reorderQty: 10,
        lowStockAlert: false
      });
    }
  }, [variant, form, open]); // re-run when modal opens/closes or variant changes

  const onSubmit = (data: ExtendedProductVariantFormValues) => {
    // Create a clean copy without the extended fields that aren't in the schema
    // Using _ prefix for variables we intentionally don't use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { priceModifierType, priceModifier, stockQuantity, ...schemaData } = data;
    
    onSave(schemaData, variant?.index);
    form.reset(); // Reset form after saving
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset(); // Reset form when closing without saving
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-sky-400 text-xl">
            {variant ? 'Edit' : 'Add New'} Variant
            {productName && <span className="text-slate-400 text-sm"> for {productName}</span>}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {variant
              ? 'Update the details for this product variant.'
              : 'Define a new variation for this product, like size or color.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="max-h-[65vh] p-1 pr-5">
              <div className="space-y-6 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Variant Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Large, Blue, Cotton"
                          {...field}
                          className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                        />
                      </FormControl>
                      <FormDescription className="text-slate-500">
                        A descriptive name for this variant (e.g., &quot;Red&quot;, &quot;XL&quot;, &quot;Set of 3&quot;).
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Variant SKU</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., PRODUCT-RED-L"
                            {...field}
                            value={field.value ?? ''}
                            className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                          />
                        </FormControl>
                        <FormDescription className="text-slate-500">
                          Optional: Stock Keeping Unit for this specific variant. If blank, may inherit or be generated.
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Variant Barcode (GTIN)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 1234567890123"
                            {...field}
                            value={field.value ?? ''}
                            className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                          />
                        </FormControl>
                        <FormDescription className="text-slate-500">
                          Optional: Barcode for this variant.
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md text-sky-500">Pricing Adjustment</CardTitle>
                    <CardDescription className="text-slate-500">
                      Define how this variant affects the product&apos;s base price.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-3">
                    {/* priceModifierType and priceModifier are custom fields for the form, not in the schema */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="buyingPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Variant Buying Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="e.g., 10.50"
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                                className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                              />
                            </FormControl>
                            <FormDescription className="text-slate-500">
                              Cost to acquire this specific variant. Overrides base product buying price if set.
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="retailPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Variant Retail Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="e.g., 19.99"
                                {...field}
                                value={field.value ?? ''}
                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                              />
                            </FormControl>
                            <FormDescription className="text-slate-500">
                              Specific retail price for this variant. Overrides base product retail price if set.
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Stock Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 100"
                          {...field}
                          className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                        />
                      </FormControl>
                      <FormDescription className="text-slate-500">
                        Current inventory level for this specific variant.
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {/* Basic Attributes Example - could be expanded to a dynamic key-value pair system */}
                <FormField
                  control={form.control}
                  name="attributes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Custom Attributes (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='e.g., { "Color": "Blue", "Material": "Cotton" }'
                          {...field}
                          value={
                            typeof field.value === 'string' ? field.value : JSON.stringify(field.value ?? {}, null, 2)
                          }
                          onChange={e => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              field.onChange(parsed);
                            } catch {
                              // Allow typing, validate on blur or submit
                              field.onChange(e.target.value);
                            }
                          }}
                          className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100 min-h-[80px] font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription className="text-slate-500">
                        Optional: Define specific attributes for this variant in JSON format (e.g., size, color,
                        material).
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Variant Weight</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="e.g., 0.5"
                            {...field}
                            value={field.value ?? ''}
                            onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                            className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                          />
                        </FormControl>
                        <FormDescription className="text-slate-500">
                          Weight of this variant. Overrides base product weight if set.
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weightUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Weight Unit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? 'WEIGHT_KG'}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                            <SelectItem value="WEIGHT_KG" className="hover:bg-slate-700 focus:bg-slate-700">
                              kg
                            </SelectItem>
                            <SelectItem value="WEIGHT_G" className="hover:bg-slate-700 focus:bg-slate-700">
                              g
                            </SelectItem>
                            <SelectItem value="WEIGHT_LB" className="hover:bg-slate-700 focus:bg-slate-700">
                              lb
                            </SelectItem>
                            <SelectItem value="WEIGHT_OZ" className="hover:bg-slate-700 focus:bg-slate-700">
                              oz
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border border-slate-700 p-3 bg-slate-700/30">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id={`variant-isActive-${variant?.id ?? 'new'}`}
                          className="border-slate-500 data-[state=checked]:bg-sky-500 data-[state=checked]:text-slate-900"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel
                          htmlFor={`variant-isActive-${variant?.id ?? 'new'}`}
                          className="text-slate-300 cursor-pointer"
                        >
                          Variant is Active
                        </FormLabel>
                        <FormDescription className="text-slate-400">
                          If unchecked, this variant will not be available for sale.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                {/* Add other fields from ProductVariantSchema */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reorderPoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Reorder Point</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            placeholder="e.g., 5"
                            {...field}
                            value={field.value ?? 5}
                            onChange={e => field.onChange(Number(e.target.value))}
                            className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                          />
                        </FormControl>
                        <FormDescription className="text-slate-500">
                          Quantity at which to reorder this variant.
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reorderQty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Reorder Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            placeholder="e.g., 10"
                            {...field}
                            value={field.value ?? 10}
                            onChange={e => field.onChange(Number(e.target.value))}
                            className="bg-slate-700 border-slate-600 focus:border-sky-500 text-slate-100"
                          />
                        </FormControl>
                        <FormDescription className="text-slate-500">
                          Quantity to reorder when stock is low.
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="lowStockAlert"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border border-slate-700 p-3 bg-slate-700/30">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id={`variant-lowStockAlert-${variant?.id ?? 'new'}`}
                          className="border-slate-500 data-[state=checked]:bg-sky-500 data-[state=checked]:text-slate-900"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel
                          htmlFor={`variant-lowStockAlert-${variant?.id ?? 'new'}`}
                          className="text-slate-300 cursor-pointer"
                        >
                          Enable Low Stock Alerts
                        </FormLabel>
                        <FormDescription className="text-slate-400">
                          Receive notifications when stock falls below reorder point.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="bg-sky-500 hover:bg-sky-600 text-slate-900 font-semibold"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {variant ? 'Save Changes' : 'Add Variant'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Helper components (Card, CardHeader, CardContent, CardTitle, CardDescription)
// Should be imported from '@/components/ui/card' or defined if not available globally
const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props} />
);
const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-4 ${className}`} {...props} />
);
const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-4 pt-0 ${className}`} {...props} />
);
const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
);
const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props} />
);
