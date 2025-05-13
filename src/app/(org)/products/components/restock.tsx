import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { useEffect } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CalendarIcon, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UNIT_OPTIONS } from '@/lib/unit-conversion';
import { useSuppliers } from '@/lib/hooks/use-supplier';
import { Badge } from '@/components/ui/badge';
import { useLocations } from '@/hooks/use-warehouse';
import { RestockFormValues, restockFormSchema, useRestock } from '@/lib/hooks/use-products';
import { Skeleton } from '@/components/ui/skeleton';

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
  const form = useForm<RestockFormValues>({
    resolver: zodResolver(restockFormSchema),
    defaultValues: {
      unit: 'PIECE',
      locationId: defaultLocationId || '',
      purchasePrice: undefined,
      expiryDate: undefined,
      notes: '',
      actualDeliveryDate: new Date(),
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        unit: 'PIECE',
        locationId: defaultLocationId || '',
        purchasePrice: undefined,
        expiryDate: undefined,
        notes: '',
        actualDeliveryDate: new Date(),
      });
    }
  }, [open, defaultLocationId, form]);

  // TanStack Query hooks
  const { data: locationsResult, error: locationsError, isLoading: loadingLocations } = useLocations();
  const { data: suppliersResult, error: suppliersError, isLoading: loadingSuppliers } = useSuppliers();

  // Custom restock mutation hook
  const restockMutation = useRestock({
    onSuccess: () => {
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    },
  });

  // Combine all errors and loading states
  const queryError = locationsError || suppliersError;
  const isLoading = loadingLocations || loadingSuppliers;
  const isSubmitting = restockMutation.isPending;

  function onSubmit(values: RestockFormValues) {
    const payload = {
      productId,
      variantId,
      ...values,
      expiryDate: values.expiryDate?.toISOString(),
      actualDeliveryDate: values.actualDeliveryDate?.toISOString(),
    };

    restockMutation.mutate(payload);
  }

  // Extract data from query results
  const locations = locationsResult?.warehouses ?? [];
  const suppliers = suppliersResult?.data?.suppliers ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        {isSubmitting && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
            <div className="flex flex-col items-center gap-2 p-4 bg-card rounded-lg shadow-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Processing restock...</p>
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            Restock Product
            <Badge variant="secondary" className="ml-2">
              New Inventory
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add new inventory for this product to your warehouse
          </DialogDescription>
        </DialogHeader>

        {queryError ? (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Fetching Data</AlertTitle>
            <AlertDescription>
              {queryError instanceof Error ? queryError.message : 'An unexpected error occurred.'}
              <div className="mt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (locationsError) {
                      restockMutation.reset();
                    }
                    if (suppliersError) {
                      restockMutation.reset();
                    }
                  }}
                >
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="flex justify-end gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        ) : (
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
                          <SelectTrigger className="h-10">
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
                      <FormDescription className="text-xs">The measurement unit for this product</FormDescription>
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
                          className="h-10"
                          type="number"
                          min="1"
                          value={field.value}
                          onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">Number of units being added</FormDescription>
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
                          <SelectTrigger className="h-10">
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
                      <FormDescription className="text-xs">Where this inventory will be stored</FormDescription>
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
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="h-10">
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
                        <FormDescription className="text-xs">Optional: Who supplied this inventory</FormDescription>
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
                        <Badge variant="outline" className="text-xs font-normal">
                          Optional
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-10"
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.value ?? ''}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">Price per unit paid to supplier</FormDescription>
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
                        <Badge variant="outline" className="text-xs font-normal">
                          Optional
                        </Badge>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className="h-10 pl-3 text-left font-normal">
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
                      <FormDescription className="text-xs">When this inventory expires (if applicable)</FormDescription>
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
                            <Button variant="outline" className="h-10 pl-3 text-left font-normal">
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
                      <FormDescription className="text-xs">When this inventory was/will be delivered</FormDescription>
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
                      <Badge variant="outline" className="text-xs font-normal">
                        Optional
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information about this restock..."
                        className="resize-none min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Additional details about this restock</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="h-10"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="h-10 px-6 font-medium">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Restock Product'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
