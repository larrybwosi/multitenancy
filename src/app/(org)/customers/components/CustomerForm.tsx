import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { User, Mail, Phone, MapPin, FileText, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { CustomerFormSchema, CustomerFormValues } from '@/lib/validations/customers';
import { useCreateCustomer } from '@/lib/hooks/use-customers';


interface CustomerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  customer?: CustomerFormValues; // For edit mode
  title?: string;
}

export function CustomerModal({
  onClose,
  customer,
  title = customer ? 'Edit Customer' : 'Create Customer',
  isOpen: externalIsOpen,
}: CustomerModalProps) {
  const [isOpen, setIsOpen] = useState(externalIsOpen || false);
  const { mutateAsync: createCustomer, isPending: creatingCustomer } = useCreateCustomer(customer)

  // Initialize form with react-hook-form and zod validation
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: {
      id: customer?.id || undefined,
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
      notes: customer?.notes || '',
    },
  });

  // Update form when customer data changes (for edit mode)
  useEffect(() => {
    if (customer) {
      form.reset({
        id: customer.id,
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        notes: customer.notes || '',
      });
    } else {
      form.reset({
        id: undefined,
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
      });
    }
  }, [customer, form]);

  // Update internal state when external isOpen changes
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  // Handle form submission

  const handleSubmit = async (data: CustomerFormValues) => {
    try {
      // Call the mutation
      await createCustomer(data);

      // Close modal and reset form
      handleClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };


  // Handle modal close
  const handleClose = () => {
    setIsOpen(false);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md transition-all duration-200"
        >
          {customer ? (
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" /> Edit Customer
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> New Customer
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader className="text-center pb-4 border-b">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {title}
          </DialogTitle>
          <DialogDescription className="max-w-md mx-auto text-gray-500">
            {customer ? 'Update customer information in your database.' : 'Add a new customer to your database.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <Card className="p-4 shadow-sm border border-gray-100 rounded-lg bg-white">
                <div className="space-y-5">
                  {/* Customer Name Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                          <User className="h-4 w-4 text-blue-500" />
                          Customer Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter customer name"
                            {...field}
                            className="w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md transition-all"
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Full name of the individual or company.
                        </FormDescription>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Email Field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                          <Mail className="h-4 w-4 text-blue-500" />
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="customer@example.com"
                            type="email"
                            {...field}
                            className="w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md transition-all"
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Primary contact email for the customer.
                        </FormDescription>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Phone Field */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                          <Phone className="h-4 w-4 text-blue-500" />
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+1 (555) 123-4567"
                            {...field}
                            className="w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md transition-all"
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Contact phone number with country code if applicable.
                        </FormDescription>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              {/* Right Column */}
              <Card className="p-4 shadow-sm border border-gray-100 rounded-lg bg-white">
                <div className="space-y-5">
                  {/* Address Field */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          Address
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="123 Main St, City, Country"
                            {...field}
                            className="w-full resize-none border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md transition-all"
                            rows={2}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Physical or billing address for the customer.
                        </FormDescription>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Notes Field */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                          <FileText className="h-4 w-4 text-blue-500" />
                          Additional Notes
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any additional information about this customer..."
                            {...field}
                            className="w-full resize-vertical border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md transition-all"
                            rows={5}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Any additional details, preferences, or important information.
                        </FormDescription>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            </div>

            <DialogFooter className="mt-8 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingCustomer}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md transition-all duration-200"
              >
                {creatingCustomer ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {customer ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {customer ? 'Update Customer' : 'Create Customer'}
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
