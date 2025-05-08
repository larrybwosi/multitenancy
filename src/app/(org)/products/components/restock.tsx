import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { useState, useTransition } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertCircle, CalendarIcon, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQueryClient } from '@tanstack/react-query';
import { UNIT_OPTIONS } from '@/lib/unit-conversion';
import { useSuppliers } from '@/lib/hooks/use-supplier';
import { Badge } from '@/components/ui/badge';
import { useLocations } from '@/hooks/use-warehouse';

const formSchema = z.object({
  unit: z.string().min(1, 'Unit is required'),
  unitQuantity: z.number().min(1, 'Quantity must be at least 1'),
  locationId: z.string().min(1, 'Location is required'),
  supplierId: z.string().optional(),
  purchasePrice: z.number().min(0, 'Price cannot be negative').optional(),
  expiryDate: z.date().optional(),
  notes: z.string().optional(),
  actualDeliveryDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RestockDialogProps {
  productId: string;
  variantId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultLocationId?: string;
  onSuccess?: () => void;
}

export function RestockDialog({
  productId,
  variantId,
  open,
  onOpenChange,
  defaultLocationId,
  onSuccess,
}: RestockDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unit: 'PIECE',
      unitQuantity: 1,
      locationId: defaultLocationId || '',
      purchasePrice: undefined,
      expiryDate: undefined,
      notes: '',
      actualDeliveryDate: new Date(),
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true);

      const payload = {
        productId,
        variantId,
        ...values,
        expiryDate: values.expiryDate?.toISOString(),
        actualDeliveryDate: values.actualDeliveryDate?.toISOString(),
      };

      startTransition(async () => {
        const response = await fetch('/api/stock/restock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        console.log(response.json());

        toast.success('Product restocked', {
          description: 'The product has been successfully restocked.',
        });

        onOpenChange(false);
        form.reset();
        onSuccess?.();
      });
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Something went wrong',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // --- Data Fetching with TanStack Query ---
  const { data: locationsResult, error: locationsError, isLoading: loadingLocations } = useLocations();

  const { data: suppliersResult, error: suppliersError, isLoading: loadingSuppliers } = useSuppliers();
  const queryError = locationsError || suppliersError;

  if (loadingLocations || loadingSuppliers) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2">Loading data...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (queryError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Fetching Data</AlertTitle>
            <AlertDescription>
              {queryError instanceof Error ? queryError.message : 'An unexpected error occurred.'}
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => {
                  if (locationsError) {
                    queryClient.invalidateQueries({ queryKey: ['warehouse'] });
                  }
                  if (suppliersError) {
                    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
                  }
                }}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  const locations = locationsResult?.warehouses ?? [];
  const suppliers = suppliersResult?.suppliers ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        {(isLoading || isPending) && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            Restock Product
            <Badge variant="secondary">New Inventory</Badge>
          </DialogTitle>
          <DialogDescription>Add new inventory for this product to your warehouse</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIT_OPTIONS.map(unit => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label} ({unit.value})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>The measurement unit for this product</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        value={field.value}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Number of units being added</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Where this inventory will be stored</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {suppliers.length > 0 && (
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Optional: Who supplied this inventory</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Purchase Price
                      <Badge variant="outline">Optional</Badge>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>Price per unit paid to supplier</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      Expiry Date
                      <Badge variant="outline">Optional</Badge>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={'outline'} className="pl-3 text-left font-normal">
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={date => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>When this inventory expires (if applicable)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actualDeliveryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Delivery Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={'outline'} className="pl-3 text-left font-normal">
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={date => date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>When this inventory was/will be delivered</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Notes
                    <Badge variant="outline">Optional</Badge>
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional information..." className="resize-none" {...field} />
                  </FormControl>
                  <FormDescription>Additional details about this restock</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isPending}>
                {(isLoading || isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Restock Product
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
