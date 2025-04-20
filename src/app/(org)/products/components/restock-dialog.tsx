'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addStockBatch } from '@/actions/stock.actions';
import { Loader2, CalendarIcon, PackagePlus, CircleAlert, Warehouse, Truck } from 'lucide-react'; // Added Warehouse, Truck
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { LocationSelect } from './location-select'; // Assuming this component is correctly implemented
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Use CardContent for padding
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator'; // Optional: for visual separation

// Utilities and Types
import { cn } from '@/lib/utils';
import { ProductVariant } from '@prisma/client';
import {
  RestockSchema,
  RestockSchemaType,
  Supplier, // Assuming Supplier type is defined here
  ProductWithRelations,
} from '@/lib/validations/product'; // Adjusted path if necessary
import useSWR from 'swr';


const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface RestockDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: ProductWithRelations | null;
  variants?: ProductVariant[]; // Keep variants as prop, specific to product
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onClose?: () => void;
}

export default function RestockDialog({
  isOpen,
  setIsOpen,
  product,
  variants = [],
  onSuccess,
  onError,
  onClose,
}: RestockDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const hasVariants = variants && variants.length > 0;

  // --- Data Fetching with SWR ---
  const { data: locationsResult, error: locationsError, isLoading: loadingLocations } = useSWR(
    '/api/warehouse', // Ensure this endpoint returns { data: InventoryLocation[] }
    fetcher,
    {
      revalidateOnMount: true,
      revalidateOnFocus: false, // Less aggressive revalidation
      shouldRetryOnError: false, // Optional: depends on desired behavior
    }
  );

  const { data: suppliersResult, error: suppliersError, isLoading: isLoadingSuppliers } = useSWR<{ data: Supplier[] }>(
    '/api/suppliers', // Ensure this endpoint returns { data: Supplier[] }
    fetcher,
    {
      revalidateOnMount: true,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Correctly use fetched suppliers
  const availableSuppliers = suppliersResult?.data ?? [];
  const hasSuppliers = availableSuppliers.length > 0;



  const hasLocations = locationsResult?.length > 0;

  const form = useForm<RestockSchemaType>({ // Explicitly type useForm
    resolver: zodResolver(RestockSchema),
    defaultValues: {
      productId: product?.id || '',
      variantId: null,
      supplierId: '',
      initialQuantity: 1,
      purchasePrice: 0.00, // Default to float
      expiryDate: null,
      location: '',
      purchaseItemId: null,
    },
  });

  // Reset form when dialog opens or product changes
  useEffect(() => {
    if (isOpen && product) {
      form.reset({
        productId: product.id,
        variantId: null,
        supplierId: '',
        initialQuantity: 1,
        purchasePrice: 0.00,
        expiryDate: null,
        location: '',
        purchaseItemId: null,
      });
      setServerError(null);
    }
    // Reset locations state if dialog closes without submission? No, let SWR manage cache.
  }, [isOpen, product, form]);

  const onSubmit = (data: RestockSchemaType) => {
    if (!product) return;

    setServerError(null);

    // Prepare data - consider sending JSON unless FormData is required by the backend
    const payload: Partial<RestockSchemaType> = {};
    Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
             if (key === 'expiryDate' && value instanceof Date) {
                 payload[key as keyof RestockSchemaType] = value.toISOString() as any; // Use ISO string
             } else {
                 payload[key as keyof RestockSchemaType] = value;
             }
        }
    });

    // Ensure required fields that might be 0 are included
    payload.initialQuantity = data.initialQuantity;
    payload.purchasePrice = data.purchasePrice;

    startTransition(async () => {
       // If using FormData is necessary:
       
       const formData = new FormData();
       Object.entries(payload).forEach(([key, value]) => {
         if (value !== null && value !== undefined) {
           formData.append(key, String(value)); // Convert all to string for FormData
         }
       });
       const result = await addStockBatch(formData);

      // Assuming addStockBatch can handle a JSON-like object (more common for APIs)
      // Adjust `addStockBatch` if it strictly requires FormData
      // const result = await addStockBatch(payload);


      if (result?.error) {
        onError?.(result.error);
      } else {
        onSuccess?.(
          `Stock added successfully for "${product?.name}"! Batch ID: ${result.data?.id ?? 'N/A'}`
        );
        setIsOpen(false); // Close dialog on success
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!isPending) { // Prevent closing while submitting
      setIsOpen(open);
      if (!open) {
        form.reset(); // Reset form on close
        setServerError(null);
        onClose?.(); // Call external close handler
      }
    }
  };

  // Determine if the form can be submitted
  const canSubmit = !!product && hasSuppliers && hasLocations && !loadingLocations && !isLoadingSuppliers;

  const navigateToSuppliers = () => {
    router.push('/suppliers'); // Adjust path if needed
    setIsOpen(false);
  };

  const navigateToLocations = () => {
      router.push('/settings/warehouse'); // Adjust path if needed
      setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto"> {/* Increased width, added scroll */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl"> {/* Larger title */}
            <PackagePlus className="h-6 w-6 text-primary" />
            <span>Add Stock: {product?.name ?? "Product"}</span>
          </DialogTitle>
          <DialogDescription>
            Fill in the details for the incoming stock batch. Required fields are marked with <span className="text-destructive">*</span>.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-4" /> {/* Visual Separator */}

        {product ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 px-2" // Increased spacing, added slight horizontal padding
            >
              {/* Display General Server Error */}
              {serverError && (
                <Alert variant="destructive" className="mb-4">
                  <CircleAlert className="h-4 w-4" />
                  <AlertTitle>Submission Error</AlertTitle>
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

               {/* Display Fetch Errors */}
              {suppliersError && (
                <Alert variant="destructive" className="mb-4">
                  <CircleAlert className="h-4 w-4" />
                  <AlertTitle>Error Loading Suppliers</AlertTitle>
                  <AlertDescription>
                      Could not load supplier data. Please try again later or check your network connection.
                      {/* Optionally add more detail: {suppliersError.message} */}
                  </AlertDescription>
                </Alert>
              )}
               {locationsError && (
                <Alert variant="destructive" className="mb-4">
                  <CircleAlert className="h-4 w-4" />
                  <AlertTitle>Error Loading Locations</AlertTitle>
                  <AlertDescription>
                      Could not load location data. Please try again later or check your network connection.
                  </AlertDescription>
                </Alert>
              )}


              <input
                type="hidden"
                {...form.register("productId")}
                value={product.id}
              />

              {/* Section 1: Product Details & Supplier */}
              <Card className="border-border/50">
                <CardHeader>
                   <CardTitle className="text-lg font-semibold flex items-center gap-2">
                       <Truck className="h-5 w-5 text-muted-foreground"/> {/* Supplier Icon */}
                       Supplier & Product Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Variant Selection (Optional) */}
                  {hasVariants && (
                    <FormField
                      control={form.control}
                      name="variantId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Variant</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value || null)}
                            value={field.value ?? ""}
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select variant (if applicable)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None (Base Product)</SelectItem>
                              {variants.map((variant) => (
                                <SelectItem key={variant.id} value={variant.id}>
                                  {variant.name}{" "}
                                  {variant.sku ? `(${variant.sku})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Supplier Selection (Required) */}
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Supplier <span className="text-destructive">*</span>
                        </FormLabel>
                         {isLoadingSuppliers ? (
                             <div className="flex items-center space-x-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading suppliers...</span>
                             </div>
                         ) : hasSuppliers ? (
                           <>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ""}
                              required
                              disabled={isPending || isLoadingSuppliers}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a supplier" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableSuppliers.map((supplier) => (
                                  <SelectItem key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Can&apos;t find the supplier?{" "}
                              <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 text-primary"
                                onClick={navigateToSuppliers}
                                disabled={isPending}
                              >
                                Add a new supplier
                              </Button>
                            </FormDescription>
                           </>
                         ) : (
                            <>
                              <Input disabled value="No suppliers found" className="border-destructive"/>
                              <FormDescription className="text-destructive">
                                Cannot add stock without suppliers.{" "}
                                <Button
                                  type="button"
                                  variant="link"
                                  className="h-auto p-0 text-primary"
                                  onClick={navigateToSuppliers}
                                  disabled={isPending}
                                >
                                  Add a supplier first
                                </Button>
                              </FormDescription>
                            </>
                         )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

               {/* Section 2: Quantity, Cost & Expiry */}
              <Card className="border-border/50">
                 <CardHeader>
                   <CardTitle className="text-lg font-semibold">Batch Details</CardTitle>
                 </CardHeader>
                <CardContent className="space-y-4">
                   {/* Quantity (Required) */}
                  <FormField
                    control={form.control}
                    name="initialQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Quantity Received <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="e.g., 50"
                            {...field}
                            onChange={(e) =>
                              // Allow empty string for clearing, parse otherwise
                              field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                            }
                             // Ensure value is number for input, handle potential string from field state
                            value={typeof field.value === 'number' ? field.value : (field.value === '' ? '' : 1)}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Grid for Price and Expiry */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Purchase Price (Required) */}
                    <FormField
                      control={form.control}
                      name="purchasePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Unit Purchase Cost ($) <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                             <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="e.g., 5.50"
                                  {...field}
                                   onChange={(e) =>
                                      // Allow empty string, parse float otherwise
                                      field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))
                                  }
                                  // Ensure value is number for input
                                  value={typeof field.value === 'number' ? field.value : (field.value === '' ? '' : 0)}
                                  disabled={isPending}
                                  className="pl-6" // Add padding for the $ sign
                                />
                             </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Expiry Date (Optional) */}
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col pt-1.5"> {/* Align label better */}
                          <FormLabel>Expiry Date (Optional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={isPending}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP") // Ensure value is Date object for format
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined} // Ensure selected is Date or undefined
                                onSelect={(date) => field.onChange(date)} // Pass Date object or null/undefined
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0)) || isPending // Disable past dates and if pending
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                           <FormDescription className="text-xs pt-1">Leave blank if not applicable.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                 </CardContent>
              </Card>

              {/* Section 3: Storage Location */}
               <Card className="border-border/50">
                 <CardHeader>
                   <CardTitle className="text-lg font-semibold flex items-center gap-2">
                       <Warehouse className="h-5 w-5 text-muted-foreground"/> {/* Location Icon */}
                       Storage Location
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                     {/* Location Selection (Required) */}
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                            Select Location <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                            {loadingLocations ? (
                                <div className="flex items-center space-x-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading locations...</span>
                                </div>
                            ) : hasLocations ? (
                                <LocationSelect // Assuming LocationSelect accepts these props
                                // @ts-expect-error // TypeScript error, ensure LocationSelect is correctly typed
                                locations={locationsResult}
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                placeholder="Select a warehouse location"
                                />
                            ) : (
                                <>
                                    <Input disabled value="No locations found" className="border-destructive"/>
                                    <FormDescription className="text-destructive">
                                        Cannot add stock without storage locations. {" "}
                                        {/* Add Link to create locations if applicable */}
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="h-auto p-0 text-primary"
                                            onClick={navigateToLocations}
                                            disabled={isPending}
                                        >
                                            Add a location
                                        </Button>
                                    </FormDescription>
                                </>
                            )}
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </CardContent>
               </Card>


              <DialogFooter className="pt-6"> {/* Add padding top */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !canSubmit}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isPending ? "Adding Stock..." : "Add Stock Batch"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          // Loading state if product data isn't available yet
          <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading Product Details...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}