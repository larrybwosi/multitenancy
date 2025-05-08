'use client';

import {useState, useRef, useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {cn} from '@/lib/utils';
import {useRouter} from 'next/navigation';
import {Upload, DollarSign, Box, Ruler, Plus, Info, Loader2, Check, X} from 'lucide-react';
import Image from 'next/image';

import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Skeleton} from '@/components/ui/skeleton';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Switch} from '@/components/ui/switch';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Badge} from '@/components/ui/badge';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import {InventoryPolicy, MeasurementUnit} from '@/prisma/client';
import {toast} from 'sonner';
import {useOrganization} from '@/hooks/use-organization';
import {useUpdateOrganization} from '@/lib/hooks/use-org';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import { useExpenseCategories } from '@/lib/hooks/use-expense-categories';
import { AddCategoryModal } from './add-expense-category-modal';
import { DeleteCategoryModal } from './delete-category-modal';
import { UpdateOrganizationInputSchema } from '@/lib/validations/organization';

// Define the timezone options
const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Africa/Nairobi',
  'Australia/Sydney',
  'Pacific/Auckland',
];

// Define currency options
const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'INR', 'BRL', 'KES', 'NGN', 'ZAR'];

type OrganizationFormValues = z.infer<typeof UpdateOrganizationInputSchema>;

interface EditOrganizationFormProps {
  onSuccess?: () => void;
}

export function EditOrganizationForm({onSuccess}: EditOrganizationFormProps) {
  const [loading, setLoading] = useState(true);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  // Category management states
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { organization, isLoading } = useOrganization();
  
  const { data: expenseCategories, isLoading: loadingExpenseCategories } = useExpenseCategories(true,activeTab === 'expenses');
  const { mutateAsync: updateOrganization, isPending: isSubmitting } = useUpdateOrganization();
  const router = useRouter();

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(UpdateOrganizationInputSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      logo: '',
      expenseApprovalRequired: false,
      expenseApprovalThreshold: null,
      expenseReceiptRequired: true,
      expenseReceiptThreshold: null,
      expenseTagOptions: [],
      defaultCurrency: 'USD',
      defaultTimezone: 'UTC',
      defaultTaxRate: null,
      inventoryPolicy: InventoryPolicy.FEFO,
      lowStockThreshold: 10,
      negativeStock: false,
      enableCapacityTracking: false,
      enforceSpatialConstraints: false,
      enableProductDimensions: false,
      defaultMeasurementUnit: MeasurementUnit.METER,
      defaultDimensionUnit: MeasurementUnit.METER,
      defaultWeightUnit: MeasurementUnit.WEIGHT_KG,
    },
  });

  // Load organization data when component mounts
  useEffect(() => {
    const loadOrganizationData = async () => {
      try {
        if (organization) {
          // Convert numeric values to numbers for the form
          const formData: OrganizationFormValues = {
            name: organization.name,
            slug: organization.slug,
            description: organization.description || '',
            logo: organization.logo || '',
            expenseApprovalRequired: organization.expenseApprovalRequired || false,
            expenseApprovalThreshold: organization.expenseApprovalThreshold ? Number(organization.expenseApprovalThreshold) : null,
            expenseReceiptRequired: organization.expenseReceiptRequired || true,
            expenseReceiptThreshold: organization.expenseReceiptThreshold ? Number(organization.expenseReceiptThreshold) : null,
            defaultTaxRate: organization.settings?.defaultTaxRate ? Number(organization.settings.defaultTaxRate) : null,
            lowStockThreshold: organization.settings?.lowStockThreshold ? Number(organization.settings.lowStockThreshold) : 10,
            expenseTagOptions: organization.expenseTagOptions || [],
            // Map other settings from the organization.settings object
            inventoryPolicy: organization.settings?.inventoryPolicy || InventoryPolicy.FEFO,
            negativeStock: organization.settings?.negativeStock || false,
            defaultMeasurementUnit: (organization.settings?.defaultMeasurementUnit as MeasurementUnit) || MeasurementUnit.METER,
            defaultDimensionUnit: (organization.settings?.defaultDimensionUnit as MeasurementUnit) || MeasurementUnit.METER,
            defaultWeightUnit: (organization.settings?.defaultWeightUnit as MeasurementUnit) || MeasurementUnit.WEIGHT_KG,
            enableCapacityTracking: organization.settings?.enableCapacityTracking || false,
            enforceSpatialConstraints: organization.settings?.enforceSpatialConstraints || false,
            enableProductDimensions: organization.settings?.enableProductDimensions || false,
            defaultCurrency: organization.settings?.defaultCurrency || 'USD',
            defaultTimezone: organization.settings?.defaultTimezone || 'UTC',
          };

          form.reset(formData);
          if (organization.logo) {
            setPreviewLogo(organization.logo);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to load organization data:', error);
        toast.error('Error loading organization data', {
          description: 'Please try again later.',
        });
        setLoading(false);
      }
    };

    loadOrganizationData();
  }, [form, isLoading]);
const onSubmit = async (data: OrganizationFormValues) => {
  try {
    // Get the initial values (from when the form was loaded)
    const initialValues = form.formState.defaultValues as OrganizationFormValues | undefined;

    // Create an object with only changed fields
    const changedFields: Partial<OrganizationFormValues> = {};

    // Compare each field with its initial value
    Object.entries(data).forEach(([key, value]) => {
      const fieldKey = key as keyof OrganizationFormValues;

      // Skip if no initial values or if the field wasn't in initial values
      if (!initialValues || !(fieldKey in initialValues)) {
        return;
      }

      // Compare current value with initial value
      if (JSON.stringify(value) !== JSON.stringify(initialValues[fieldKey])) {
        // Type-safe assignment
        changedFields[fieldKey] = value as never;
      }
    });

    // Convert numeric values in changed fields to numbers for API
    const apiData: Partial<OrganizationFormValues> = {
      ...changedFields,
    };

    // Handle numeric conversions only for fields that exist in changedFields
    if ('expenseApprovalThreshold' in changedFields) {
      apiData.expenseApprovalThreshold =
        changedFields.expenseApprovalThreshold !== null ? Number(changedFields.expenseApprovalThreshold) : null;
    }

    if ('expenseReceiptThreshold' in changedFields) {
      apiData.expenseReceiptThreshold =
        changedFields.expenseReceiptThreshold !== null ? Number(changedFields.expenseReceiptThreshold) : null;
    }

    if ('defaultTaxRate' in changedFields) {
      apiData.defaultTaxRate = changedFields.defaultTaxRate !== null ? Number(changedFields.defaultTaxRate) : null;
    }

    if ('lowStockThreshold' in changedFields) {
      apiData.lowStockThreshold =
        changedFields.lowStockThreshold !== undefined ? Number(changedFields.lowStockThreshold) : 10;
    }

    await updateOrganization(apiData);

    toast.success('Organization updated', {
      description: 'Your organization settings have been updated successfully.',
    });

    if (onSuccess) {
      onSuccess();
    }

    router.refresh();
  } catch (error) {
    console.error('Failed to update organization:', error);
    toast.error('Error updating organization', {
      description: 'There was an error updating your organization. Please try again.',
    });
  }
};

  //https://i.pinimg.com/736x/af/63
  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please upload an image file (JPEG, PNG, SVG, or WebP).',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Logo image must be less than 5MB.',
      });
      return;
    }

    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewLogo(objectUrl);

    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Update form with the new logo URL
      form.setValue('logo', result.url);

      toast.success('Logo uploaded', {
        description: 'Your organization logo has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Logo upload failed:', error);
      toast.error('Upload failed', {
        description: 'There was an error uploading your logo. Please try again.',
      });
      // Revert to previous logo if there was one
      setPreviewLogo(form.getValues('logo') || null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      const currentTags = form.getValues('expenseTagOptions') || [];
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue('expenseTagOptions', [...currentTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    const currentTags = form.getValues('expenseTagOptions') || [];
    form.setValue(
      'expenseTagOptions',
      currentTags.filter(t => t !== tag)
    );
  };

  // Error rendering component
  if (!organization && !isLoading && !loading) {
    return (
      <div className="space-y-4">
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center">
              <X className="mr-2 h-5 w-5" />
              Error Loading Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We couldn&apos;t load your organization information. This could be due to a connection issue or because you
              don&apos;t have sufficient permissions.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()} variant="outline" className="mr-2">
              Try Again
            </Button>
            <Button onClick={() => router.push('/dashboard')} variant="destructive">
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center mb-6">
          <div className="grid w-full max-w-md grid-cols-4 gap-1">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-md" />
              ))}
          </div>
          <Skeleton className="ml-auto h-10 w-28" />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-[180px] mb-2" />
              <Skeleton className="h-5 w-[250px]" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col space-y-4">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-40 w-40 rounded-lg" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="space-y-8">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-[180px] mb-2" />
              <Skeleton className="h-5 w-[250px]" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array(2)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <TabsList className="grid w-full max-w-md grid-cols-4 mb-2 sm:mb-0">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="spatial">Spatial</TabsTrigger>
              </TabsList>
              <Button type="submit" disabled={isSubmitting || uploadingLogo} className="ml-auto flex items-center">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving changes...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
            </div>

            {/* GENERAL SETTINGS TAB */}
            <TabsContent value="general" className="space-y-6">
              {/* Logo upload card */}
              <Card className="border-2 transition-all hover:shadow-md">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center text-xl">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 mr-2"
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="M8 12l2 2 4-4" />
                    </svg>
                    Organization Identity
                  </CardTitle>
                  <CardDescription>
                    Create a strong brand identity for your organization with a custom name, logo, and URL.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                  <div className="flex flex-col space-y-4">
                    <div className="text-lg font-medium flex items-center">Organization Logo</div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg,image/png,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                    />

                    <div
                      onClick={handleLogoClick}
                      className={cn(
                        'relative flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-all',
                        'w-40 h-40 group hover:border-primary',
                        uploadingLogo && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {previewLogo ? (
                        <div className="relative w-full h-full">
                          <Image src={previewLogo} alt="Organization logo" fill className="object-contain p-2" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                            <Upload className="h-10 w-10 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <Upload className="h-10 w-10 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload logo</p>
                        </div>
                      )}
                      {uploadingLogo && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Recommended size: 512x512px. Max 5MB (JPEG, PNG, SVG, WebP)
                    </p>
                  </div>

                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Inc." {...field} className="h-11" />
                          </FormControl>
                          <FormDescription>
                            This is your organization&apos;s display name, visible to all users.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Organization URL</FormLabel>
                          <FormControl>
                            <div className="flex items-center h-11">
                              <span className="px-3 bg-muted border-r border-input rounded-l-md h-full flex items-center text-muted-foreground">
                                domain.com/
                              </span>
                              <Input placeholder="acme" {...field} className="rounded-l-none h-full" />
                            </div>
                          </FormControl>
                          <FormDescription>
                            This is your organization&apos;s unique URL identifier that appears in the browser address
                            bar.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 transition-all hover:shadow-md">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center text-xl">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 mr-2"
                    >
                      <path d="M12 2H2v10h10V2z" />
                      <path d="M22 12h-10v10h10V12z" />
                      <path d="M12 12H2v10h10V12z" />
                      <path d="M22 2h-10v10h10V2z" />
                    </svg>
                    General Settings
                  </CardTitle>
                  <CardDescription>
                    Configure default values for your organization&apos;s operations and transactions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="defaultCurrency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Default Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select a currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencies.map(currency => (
                                <SelectItem key={currency} value={currency}>
                                  {currency}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Sets the primary currency for all financial transactions in your organization.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="defaultTimezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Default Timezone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select a timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timezones.map(timezone => (
                                <SelectItem key={timezone} value={timezone}>
                                  {timezone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>The primary timezone used for reporting and scheduling.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="defaultTaxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Default Tax Rate</FormLabel>
                        <FormControl>
                          <div className="flex h-11 items-center">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1"
                              placeholder="0.20"
                              {...field}
                              value={field.value || ''}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                              className="rounded-r-none"
                            />
                            <div className="h-full px-3 flex items-center bg-muted border border-l-0 border-input rounded-r-md">
                              <span className="text-muted-foreground">
                                ({field.value ? (parseFloat(field.value.toString()) * 100).toFixed(2) : '0.00'}%)
                              </span>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Standard tax rate applied to products and services (enter as decimal: 0.20 = 20%).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Organization Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of your organization's purpose and activities..."
                            className="resize-none min-h-32"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a concise overview of your organization. This may be displayed in reports and
                          communications.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* EXPENSES TAB */}
            <TabsContent value="expenses" className="space-y-6">
              <Card className="border-2 transition-all hover:shadow-md">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center text-xl">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 mr-2"
                    >
                      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                    </svg>
                    Expense Management
                  </CardTitle>
                  <CardDescription>
                    Configure policies for expense tracking, approvals, and categorization within your organization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="expenseApprovalRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 p-4 transition-all hover:bg-muted/20">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">Require Expense Approval</FormLabel>
                            <FormDescription>Expenses must be approved before processing</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-primary"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expenseReceiptRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 p-4 transition-all hover:bg-muted/20">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">Require Expense Receipts</FormLabel>
                            <FormDescription>Receipts must be attached to expense claims</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-primary"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="expenseApprovalThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Approval Threshold</FormLabel>
                          <FormControl>
                            <div className="flex h-11 items-center">
                              <div className="h-full px-3 flex items-center bg-muted border border-r-0 border-input rounded-l-md">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="100.00"
                                {...field}
                                value={field.value || ''}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                                className="rounded-l-none"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Expenses above this amount require approval. Leave blank to require approval for all
                            expenses.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expenseReceiptThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Receipt Threshold</FormLabel>
                          <FormControl>
                            <div className="flex h-11 items-center">
                              <div className="h-full px-3 flex items-center bg-muted border border-r-0 border-input rounded-l-md">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="25.00"
                                {...field}
                                value={field.value || ''}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                                className="rounded-l-none"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Expenses above this amount require receipts. Leave blank to require receipts for all
                            expenses.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="expenseTagOptions"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Expense Tag Options</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Input
                                placeholder="Add a tag and press Enter"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  if (tagInput.trim()) {
                                    const currentTags = form.getValues('expenseTagOptions') || [];
                                    if (!currentTags.includes(tagInput.trim())) {
                                      form.setValue('expenseTagOptions', [...currentTags, tagInput.trim()]);
                                    }
                                    setTagInput('');
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 min-h-12 p-2 border rounded-md bg-muted/20">
                              {form.watch('expenseTagOptions')?.map(tag => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="flex items-center gap-1 px-3 py-1.5 text-sm group hover:bg-secondary/80"
                                >
                                  {tag}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 rounded-full opacity-70 group-hover:opacity-100"
                                    onClick={() => handleRemoveTag(tag)}
                                  >
                                    ×
                                  </Button>
                                </Badge>
                              ))}
                              {!form.watch('expenseTagOptions')?.length && (
                                <div className="text-sm text-muted-foreground italic p-2">No tags defined yet</div>
                              )}
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Define predefined tags for categorizing expenses. Users can select from these tags when
                          creating expenses.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Card className="border-2">
                    <CardHeader className="bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center text-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 mr-2"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            Expense Categories
                          </CardTitle>
                          <CardDescription>Manage categories for organizing and reporting on expenses</CardDescription>
                        </div>
                        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                          <DialogTrigger asChild>
                            <Button className="gap-1">
                              <Plus className="h-4 w-4" />
                              Add Category
                            </Button>
                          </DialogTrigger>
                          <AddCategoryModal
                            open={isAddCategoryOpen}
                            onOpenChange={setIsAddCategoryOpen}
                            onSuccess={() => {}}
                          />
                        </Dialog>

                        <DeleteCategoryModal
                          open={isDeleteCategoryOpen}
                          onOpenChange={setIsDeleteCategoryOpen}
                          categoryId={categoryToDelete}
                          onSuccess={() => {}}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {loadingExpenseCategories ? (
                        <div className="space-y-3">
                          {Array(3)
                            .fill(0)
                            .map((_, i) => (
                              <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                      ) : !!expenseCategories?.length ? (
                        <div className="rounded-md border-2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {expenseCategories?.map(category => (
                                <TableRow key={category.id} className="hover:bg-muted/50">
                                  <TableCell className="font-medium">{category.name}</TableCell>
                                  <TableCell>
                                    {category.code ? (
                                      <Badge variant="outline" className="font-mono">
                                        {category.code}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="max-w-md truncate">
                                    {category.description || (
                                      <span className="text-muted-foreground italic">No description</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                      onClick={() => {
                                        setCategoryToDelete(category.id);
                                        setIsDeleteCategoryOpen(true);
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-12 space-y-4 border-2 border-dashed rounded-lg">
                          <svg
                            className="mx-auto h-12 w-12 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                            />
                          </svg>
                          <h3 className="text-sm font-medium">No categories defined</h3>
                          <p className="text-sm text-muted-foreground">
                            Create expense categories to organize and analyze your spending.
                          </p>
                          <div className="mt-6">
                            <Button onClick={() => setIsAddCategoryOpen(true)}>
                              <Plus className="-ml-1 mr-2 h-5 w-5" />
                              Create New Category
                            </Button>
                          </div>
                        </div>
                      )}

                      <Alert className="mt-6 border-2 border-muted bg-muted/20">
                        <Info className="h-4 w-4" />
                        <AlertTitle>About Expense Categories</AlertTitle>
                        <AlertDescription>
                          Categories help organize expenses and generate accurate financial reports. Each category can
                          have an optional code for accounting systems and reporting purposes.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* INVENTORY TAB */}
            <TabsContent value="inventory" className="space-y-6">
              <Card className="border-2 transition-all hover:shadow-md">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center text-xl">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 mr-2"
                    >
                      <path d="M12 2a10 10 0 1 0 10 10H12V2Z" />
                      <path d="M12 12 2.1 7.8a10 10 0 0 0 2.5 12.2" />
                      <path d="m12 12 4.3 7.5a10 10 0 0 0 5.5-9.5" />
                    </svg>
                    Inventory Management
                  </CardTitle>
                  <CardDescription>
                    Configure how inventory is tracked and managed throughout your organization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="inventoryPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Inventory Policy</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select a policy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FIFO">
                                <div>
                                  <div className="font-medium">FIFO (First In, First Out)</div>
                                  <div className="text-xs text-muted-foreground">Oldest inventory is used first</div>
                                </div>
                              </SelectItem>
                              <SelectItem value="LIFO">
                                <div>
                                  <div className="font-medium">LIFO (Last In, First Out)</div>
                                  <div className="text-xs text-muted-foreground">Newest inventory is used first</div>
                                </div>
                              </SelectItem>
                              <SelectItem value="FEFO">
                                <div>
                                  <div className="font-medium">FEFO (First Expired, First Out)</div>
                                  <div className="text-xs text-muted-foreground">
                                    Soonest-to-expire items used first
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Determines how inventory is processed and consumed when fulfilling orders.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lowStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Low Stock Threshold</FormLabel>
                          <FormControl>
                            <div className="flex h-11 items-center">
                              <div className="h-full px-3 flex items-center bg-muted border border-r-0 border-input rounded-l-md">
                                <Box className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="10"
                                {...field}
                                value={field.value || ''}
                                onChange={e => field.onChange(e.target.value)}
                                className="rounded-l-none"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            The quantity at which products are flagged as low stock and trigger alerts.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="negativeStock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 p-4 transition-all hover:bg-muted/20">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium">Allow Negative Stock</FormLabel>
                          <FormDescription>
                            When enabled, orders can be fulfilled even when inventory is depleted
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Alert className="border-2 border-muted bg-muted/10">
                    <div className="flex items-center gap-2 text-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-muted-foreground"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                      <span className="text-muted-foreground">
                        For detailed inventory settings, including locations, bins, and categories, please use the
                        dedicated{' '}
                        <Button
                          variant="link"
                          className="h-auto p-0 text-primary"
                          onClick={() => router.push('/inventory')}
                        >
                          Inventory Management
                        </Button>{' '}
                        section.
                      </span>
                    </div>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SPATIAL TAB */}
            <TabsContent value="spatial" className="space-y-6">
              <Card className="border-2 transition-all hover:shadow-md">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center text-xl">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 mr-2"
                    >
                      <path d="m3 10 8-7 9 7-9 7-8-7" />
                      <path d="M11 14v5a2 2 0 0 0 2 2h2" />
                    </svg>
                    Spatial Management
                  </CardTitle>
                  <CardDescription>
                    Configure how physical space and dimensions are tracked in your warehouses and locations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="enableCapacityTracking"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 p-4 transition-all hover:bg-muted/20">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">Enable Capacity Tracking</FormLabel>
                            <FormDescription>
                              Track and manage physical space capacity in your facilities
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-primary"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="enforceSpatialConstraints"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 p-4 transition-all hover:bg-muted/20">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">Enforce Spatial Constraints</FormLabel>
                            <FormDescription>Prevent exceeding physical capacity limits in locations</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-primary"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="enableProductDimensions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 p-4 transition-all hover:bg-muted/20">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium">Enable Product Dimensions</FormLabel>
                          <FormDescription>
                            Track physical dimensions of products for space optimization
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="defaultMeasurementUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Default Measurement System</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select a measurement system" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={MeasurementUnit.METER}>
                                <div className="font-medium">Metric</div>
                              </SelectItem>
                              <SelectItem value={MeasurementUnit.FEET}>
                                <div className="font-medium">Imperial</div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The primary measurement system used throughout your organization.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="defaultDimensionUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Default Dimension Unit</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select a unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(MeasurementUnit)
                                .filter(
                                  value =>
                                    value === MeasurementUnit.METER ||
                                    value === MeasurementUnit.FEET ||
                                    value === MeasurementUnit.SQUARE_METER ||
                                    value === MeasurementUnit.SQUARE_FEET ||
                                    value === MeasurementUnit.CUBIC_METER ||
                                    value === MeasurementUnit.CUBIC_FEET
                                )
                                .map(value => (
                                  <SelectItem key={value} value={value}>
                                    {value
                                      .replace(/_/g, ' ')
                                      .toLowerCase()
                                      .replace(/\b\w/g, l => l.toUpperCase())}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The default unit used when measuring dimensions of products and spaces.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="defaultWeightUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Default Weight Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select a unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(MeasurementUnit)
                              .filter(
                                value => value === MeasurementUnit.WEIGHT_KG || value === MeasurementUnit.WEIGHT_LB
                              )
                              .map(unit => (
                                <SelectItem key={unit} value={unit}>
                                  {unit.replace('WEIGHT_', '').replace(/_/g, ' ')}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>The default unit used when measuring weight of products.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-2 transition-all hover:shadow-md">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center text-xl">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 mr-2"
                    >
                      <path d="M2 12h5" />
                      <path d="M17 12h5" />
                      <path d="M7 12a5 5 0 0 1 5-5" />
                      <path d="M12 17a5 5 0 0 1-5-5" />
                      <path d="M12 7v5" />
                      <path d="M12 12h5" />
                    </svg>
                    Visualization Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how spatial data is displayed and visualized in your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="bg-muted/20 p-6 rounded-lg border-2 border-muted flex items-center gap-4">
                    <Ruler className="h-8 w-8 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-base font-medium">Spatial Visualization Configuration</span>
                      <span className="text-sm text-muted-foreground">
                        Spatial visualization settings are managed through the warehouse management interface. Enable
                        capacity tracking above to access these features.
                      </span>
                      <Button
                        variant="outline"
                        className="mt-4 self-start"
                        onClick={() => router.push('/inventory/warehouses')}
                      >
                        Manage Warehouses
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}

export default EditOrganizationForm;
