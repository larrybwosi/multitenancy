'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Building2,
  MapPin,
  User,
  Package,
  AlertCircle,
  MapPinned,
  Mail,
  FileText,
  Loader2,
  Save,
  X,
  Waves,
  Warehouse as WarehouseIcon,
  ClipboardList,
} from 'lucide-react';
import { InventoryLocation } from '@/prisma/client';
import { Member } from '@/prisma/client';
import { StorageZone } from '@/prisma/client';
import { StorageUnit } from '@/prisma/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Schema validation for form fields
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  location: z.string().min(2, { message: 'Location must be at least 2 characters' }),
  manager: z.string().min(2, { message: 'Manager name must be at least 2 characters' }),
  capacity: z.coerce.number().positive({ message: 'Capacity must be a positive number' }),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']),
  description: z.string().optional(),
  address: z.string().min(5, { message: 'Address must be at least 5 characters' }),
  isDefault: z.boolean().default(false),
  capacityTracking: z.boolean().default(true),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Status options with color mappings
const statusOptions = [
  {
    value: 'ACTIVE',
    label: 'Active',
    color: 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    value: 'MAINTENANCE',
    label: 'Maintenance',
    color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    value: 'INACTIVE',
    label: 'Inactive',
    color: 'text-gray-700 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
  },
];

interface WarehouseEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: Warehouse;
  onSave: (data: FormValues) => Promise<boolean>;
}

type Warehouse = InventoryLocation & {
  manager?: Member;
  zones?: StorageZone[];
  storageUnits?: StorageUnit[];
  stockItems?: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    value: number;
  }[];
  productCount?: number;
  stockValue?: number;
  isDefault?: boolean;
  capacityTracking?: boolean;
  email?: string;
  phone?: string;
};

export function WarehouseEditSheet({ open, onOpenChange, warehouse, onSave }: WarehouseEditSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: warehouse?.name || '',
      status: warehouse?.isActive === true ? 'ACTIVE' : warehouse?.isActive === false ? 'INACTIVE' : 'ACTIVE',
      description: warehouse?.description || '',
      address: warehouse?.address || '',
      isDefault: warehouse?.isDefault || false,
      capacityTracking: warehouse?.capacityTracking || true,
      email: warehouse?.email || '',
      phone: warehouse?.phone || '',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const success = await onSave(values);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto p-0">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <Waves className="w-full h-full text-white" />
          </div>
          <SheetHeader className="text-white relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <WarehouseIcon className="h-6 w-6 text-white" />
              </div>
              <SheetTitle className="text-2xl font-bold">
                {warehouse?.id ? 'Edit Warehouse' : 'Add Warehouse'}
              </SheetTitle>
            </div>
            <SheetDescription className="text-blue-100 mt-2">
              {warehouse?.id ? 'Update the warehouse details and settings' : 'Create a new warehouse location'}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs defaultValue="general" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="hidden sm:inline">General</span>
                  </TabsTrigger>
                  <TabsTrigger value="operational" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="hidden sm:inline">Operations</span>
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">Contact</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6 mt-0">
                  {/* General Info Card */}
                  <div className="border border-gray-200 rounded-lg p-5 bg-white dark:bg-gray-950 dark:border-gray-800 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Basic Information
                    </h3>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="mb-5">
                          <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-gray-500" />
                            Warehouse Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Main Warehouse"
                              className="focus-visible:ring-blue-500 focus-visible:border-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            The name of the warehouse location
                          </FormDescription>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-gray-500" />
                              Location
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="New York, NY"
                                className="focus-visible:ring-blue-500 focus-visible:border-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">City and state/province</FormDescription>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="manager"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-gray-500" />
                              Manager
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="John Smith"
                                className="focus-visible:ring-blue-500 focus-visible:border-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                              Person responsible for this warehouse
                            </FormDescription>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 mt-5 pt-5">
                      <FormField
                        control={form.control}
                        name="isDefault"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-medium cursor-pointer">
                                Set as Default Location
                              </FormLabel>
                              <FormDescription className="text-xs text-gray-500">
                                Make this the default warehouse for new products
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="operational" className="space-y-6 mt-0">
                  {/* Operational Details Card */}
                  <div className="border border-gray-200 rounded-lg p-5 bg-white dark:bg-gray-950 dark:border-gray-800 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Operational Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <FormField
                        control={form.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-gray-500" />
                              Capacity
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  placeholder="10000"
                                  className="focus-visible:ring-blue-500 focus-visible:border-blue-500"
                                  {...field}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500 sm:text-sm">units</span>
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                              Maximum storage capacity
                            </FormDescription>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5 text-gray-500" />
                              Status
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="focus-visible:ring-blue-500 focus-visible:border-blue-500">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {statusOptions.map(option => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="focus:bg-blue-50 dark:focus:bg-blue-900/20"
                                  >
                                    <span className="flex items-center">
                                      <Badge className={`${option.color} mr-2 border`}>
                                        {option.value === 'ACTIVE' && (
                                          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-green-400 inline-block"></span>
                                        )}
                                        {option.label}
                                      </Badge>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-xs text-gray-500">
                              Current operational status
                            </FormDescription>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="capacityTracking"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 p-3 shadow-sm mb-5">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium cursor-pointer">
                              Enable Capacity Tracking
                            </FormLabel>
                            <FormDescription className="text-xs text-gray-500">
                              Track capacity usage and get alerts when capacity is running low
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-gray-500" />
                            Description
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter a description of the warehouse"
                              className="min-h-24 resize-none focus-visible:ring-blue-500 focus-visible:border-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Additional details about this warehouse
                          </FormDescription>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-6 mt-0">
                  {/* Contact Information Card */}
                  <div className="border border-gray-200 rounded-lg p-5 bg-white dark:bg-gray-950 dark:border-gray-800 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Contact Information
                    </h3>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="mb-5">
                          <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                            <MapPinned className="h-3.5 w-3.5 text-gray-500" />
                            Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123 Storage Ave, New York, NY 10001"
                              className="focus-visible:ring-blue-500 focus-visible:border-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Full street address of the warehouse
                          </FormDescription>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-gray-500" />
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="warehouse@example.com"
                                className="focus-visible:ring-blue-500 focus-visible:border-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                              Contact email for this location
                            </FormDescription>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                              <ClipboardList className="h-3.5 w-3.5 text-gray-500" />
                              Phone
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+1 (555) 123-4567"
                                className="focus-visible:ring-blue-500 focus-visible:border-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">Contact phone number</FormDescription>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="sticky bottom-0 bg-white dark:bg-gray-950 pt-4 border-t border-gray-200 dark:border-gray-800 mt-6">
                <SheetFooter className="flex justify-between sm:justify-end gap-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </SheetFooter>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
