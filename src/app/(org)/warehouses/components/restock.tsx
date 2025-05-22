'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUnitsOfMeasure } from '@/lib/hooks/use-units';
import { useBulkRestock } from '@/lib/hooks/use-products';

// Define types (align with your actual data structures)
interface ProductVariantInfo {
  id: string;
  name: string;
  sku: string;
  // You might also include baseUnit info here if helpful for display
}


interface RestockProductsModalProps {
  isOpen: boolean;
  onOpenChange:(v:boolean)=>void
  variantList: ProductVariantInfo[];
  locationId: string;
}

const restockItemSchema = z.object({
  productVariantId: z.string().min(1, 'Product variant is required.'),
  quantityInRestockUnit: z.coerce
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Quantity must be positive.'),
  restockUnitId: z.string().min(1, 'Restock unit is required.'),
  purchasePricePerRestockUnit: z.coerce.number().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.date().optional(),
  supplierId: z.string().optional(), // Assuming supplier ID is a string
});

const restockFormSchema = z.object({
  items: z.array(restockItemSchema).min(1, 'At least one item is required for restocking.'),
  notes: z.string().optional(),
});

type RestockFormValues = z.infer<typeof restockFormSchema>;

export function RestockProductsModal({
  isOpen,
  onOpenChange,
  variantList,
  locationId,
}: RestockProductsModalProps) {
    const { data: unitsOfMeasure, isLoading: unitsOfMeasureLoading } = useUnitsOfMeasure();

  const form = useForm<RestockFormValues>({
    resolver: zodResolver(restockFormSchema),
    defaultValues: {
      items: [{ productVariantId: '', quantityInRestockUnit: 0, restockUnitId: '' }],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
const { mutateAsync: bulkRestock, isPending: restocking } = useBulkRestock()
  const onSubmit = async(values: RestockFormValues) => {
   await bulkRestock({
      ...values,
      locationId,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Restock Products</DialogTitle>
          <DialogDescription>Add products to your inventory for location: {locationId}.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-3 relative">
                  <FormLabel className="text-lg font-medium">Item {index + 1}</FormLabel>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productVariantId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Variant*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a product variant" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {variantList.map(variant => (
                                <SelectItem key={variant.id} value={variant.id}>
                                  {variant.name} ({variant.sku})
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
                      name={`items.${index}.restockUnitId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restock Unit*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select restock unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {/* TODO: Ideally, filter units based on the selected productVariantId.
                                This might involve knowing the variant's baseUnitId and checking
                                which of 'allUnitsOfMeasure' can be converted to it.
                                For now, showing all available units.
                              */}
                              {!unitsOfMeasureLoading &&
                                unitsOfMeasure &&
                                unitsOfMeasure?.map(unit => (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    {unit.name} ({unit.symbol})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantityInRestockUnit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity (in Restock Unit)*</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 10"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.purchasePricePerRestockUnit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Price (per Restock Unit)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 25.50"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.batchNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., BN12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.expiryDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col pt-2">
                          <FormLabel>Expiry Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`items.${index}.supplierId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter supplier ID if applicable" {...field} />
                        </FormControl>
                        <FormDescription>Link this restock item to a supplier.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => append({ productVariantId: '', quantityInRestockUnit: 0, restockUnitId: '' })}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Product
            </Button>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Received via PO#123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={restocking}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={restocking}>
                {restocking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Restocking...
                  </>
                ) : (
                  'Submit Restock'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// How to use it in a page:
//
// <RestockProductsModal
//   variantList={fetchedVariants}
//   allUnitsOfMeasure={fetchedUnits}
//   locationId="your_location_id"
//   organizationId="your_org_id"
//   memberId="current_user_member_id"
// >
//   <Button> <PlusCircle className="mr-2 h-4 w-4" /> Restock Products</Button>
// </RestockProductsModal>
