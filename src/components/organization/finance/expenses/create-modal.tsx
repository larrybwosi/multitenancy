import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarIcon,
  XCircle,
  Receipt,
  Info,
  DollarSign,
  MapPin,
  Building,
  Tag,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useCreateExpense } from '@/lib/hooks/use-expenses';
import { useExpenseCategories } from '@/lib/hooks/use-expense-categories';
import { useLocations } from '@/hooks/use-warehouse';
import { useSuppliers } from '@/lib/hooks/use-supplier';
import { CreateExpenseSchema } from '@/lib/validations/expenses';
import { PaymentMethod } from '@/prisma/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui';

const ExpenseModal = ({ isOpen, onClose }:{isOpen:boolean , onClose:()=>void}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const { mutateAsync: createExpense, isPending: creatingExpense } = useCreateExpense();
  const { data: categories, isLoading: loadingCategories, error: categoriesError } = useExpenseCategories();
  const { data: locationsResult, error: locationsError, isLoading: isLoadingLocations } = useLocations();
  const { data: suppliersResult, error: suppliersError, isLoading: isLoadingSuppliers } = useSuppliers();
  const locations = locationsResult?.warehouses || [];
  const suppliers = suppliersResult?.data?.suppliers || [];

  const form = useForm({
    resolver: zodResolver(CreateExpenseSchema),
    defaultValues: {
      description: '',
      expenseDate: new Date(),
      categoryId: '',
      paymentMethod: PaymentMethod.CASH,
      receiptUrl: null,
      notes: '',
      locationId: '',
      supplierId: null,
      purchaseId: null,
      budgetId: null,
      tags: [],
      taxAmount: null,
      mileage: null,
      isBillable: false,
    },
  });

  const handleFileUpload = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload?file=true', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      form.setValue('receiptUrl', data.url);
    } catch (error) {
      toast.error('Failed to upload receipt: ', {
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async data => {
    try {
      await createExpense(data);
      onClose();
    } catch (error) {
      console.error('Failed to create expense:', error);
    }
  };

  const isLoading = loadingCategories || isLoadingLocations || isLoadingSuppliers || creatingExpense;
  const hasErrors = categoriesError || locationsError || suppliersError;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <ScrollArea>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add New Expense</DialogTitle>
            <DialogDescription className="text-gray-500">
              Enter the details of your expense. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          {hasErrors && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>There was an error loading some data. Please try again later.</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Description <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FileText className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                          <Input placeholder="Enter expense description" className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Provide a clear description of what this expense is for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount and Tax Amount in a row */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">
                          Amount <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input type="number" placeholder="0.00" className="pl-8" step="0.01" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Tax Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="pl-8"
                              step="0.01"
                              {...field}
                              value={field.value || ''}
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Date and Category in a row */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expenseDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="font-medium">
                          Date <span className="text-red-500">*</span>
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
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

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">
                          Category <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select disabled={loadingCategories} onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map(category => (
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

                {/* Location and Payment Method in a row */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="locationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">
                          Location <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select disabled={isLoadingLocations} onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location">
                                <div className="flex items-center">
                                  <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                                  <span>Select location</span>
                                </div>
                              </SelectValue>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">
                          Payment Method <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(PaymentMethod).map(method => (
                              <SelectItem key={method} value={method}>
                                <div className="flex items-center">
                                  <Badge
                                    variant={
                                      method === PaymentMethod.CASH
                                        ? 'default'
                                        : method === PaymentMethod.CREDIT_CARD
                                          ? 'secondary'
                                          : method === PaymentMethod.BANK_TRANSFER
                                            ? 'outline'
                                            : 'default'
                                    }
                                    className="mr-2 capitalize"
                                  >
                                    {method.toLowerCase().replace('_', ' ')}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Supplier */}
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Supplier</FormLabel>
                      <Select disabled={isLoadingSuppliers} onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier">
                              <div className="flex items-center">
                                <Building className="mr-2 h-4 w-4 text-gray-500" />
                                <span>Select supplier</span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>None</SelectLabel>
                            {suppliers.map(supplier => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Receipt Upload */}
                <FormField
                  control={form.control}
                  name="receiptUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Receipt</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-10"
                                onClick={() => document.getElementById('receipt-upload').click()}
                                disabled={isUploading}
                              >
                                <Receipt className="mr-2 h-4 w-4" />
                                {isUploading ? 'Uploading...' : 'Upload Receipt'}
                              </Button>
                              {field.value && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => form.setValue('receiptUrl', null)}
                                >
                                  <XCircle className="h-4 w-4 text-gray-500" />
                                </Button>
                              )}
                            </div>
                            <input
                              id="receipt-upload"
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={handleFileUpload}
                            />
                          </div>
                          {field.value && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <Info className="h-4 w-4" />
                              <span>Receipt uploaded successfully</span>
                            </div>
                          )}
                          {uploadError && (
                            <div className="flex items-center gap-2 text-sm text-red-500">
                              <AlertCircle className="h-4 w-4" />
                              <span>{uploadError}</span>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Upload receipt (Max. 5MB) - JPG, PNG, or PDF
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes here..."
                          className="resize-none min-h-[100px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Billable */}
                <FormField
                  control={form.control}
                  name="isBillable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="font-medium">Billable Expense</FormLabel>
                        <FormDescription className="text-xs">Mark this expense as billable to client</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Mileage */}
                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Mileage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter mileage (optional)"
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">Enter mileage if this is a travel expense</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="ml-2">
                  {creatingExpense ? 'Saving...' : 'Save Expense'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseModal;
