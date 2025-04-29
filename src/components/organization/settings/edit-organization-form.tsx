'use client';

import {useState, useRef, useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {cn} from '@/lib/utils';
import {useRouter} from 'next/navigation';
import {Upload, DollarSign, Box, Ruler} from 'lucide-react';
import Image from 'next/image';

import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {Skeleton} from '@/components/ui/skeleton';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Switch} from '@/components/ui/switch';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Badge} from '@/components/ui/badge';
import {InventoryPolicy, MeasurementUnit} from '@prisma/client';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/use-organization';
import { useUpdateOrganization } from '@/lib/hooks/use-org';

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

// Organization form schema with all new fields
const organizationFormSchema = z.object({
  // Basic organization details
  name: z
    .string()
    .min(2, {
      message: 'Organization name must be at least 2 characters.',
    })
    .max(50, {
      message: 'Organization name must not exceed 50 characters.',
    }),
  slug: z
    .string()
    .min(2, {
      message: 'Slug must be at least 2 characters.',
    })
    .max(30, {
      message: 'Slug must not exceed 30 characters.',
    })
    .regex(/^[a-z0-9-]+$/, {
      message: 'Slug can only contain lowercase letters, numbers, and hyphens.',
    }),
  description: z
    .string()
    .max(500, {
      message: 'Description must not exceed 500 characters.',
    })
    .optional(),
  logo: z.string().optional(),

  // Expense Management Settings
  expenseApprovalRequired: z.boolean().default(false),
  expenseApprovalThreshold: z
    .union([
      z.string().refine(val => !isNaN(parseFloat(val)), {
        message: 'Must be a valid number',
      }),
      z.number(),
    ])
    .optional()
    .nullable(),
  expenseReceiptRequired: z.boolean().default(true),
  expenseReceiptThreshold: z
    .union([
      z.string().refine(val => !isNaN(parseFloat(val)), {
        message: 'Must be a valid number',
      }),
      z.number(),
    ])
    .optional()
    .nullable(),
  defaultExpenseCurrency: z.string().default('USD'),
  expenseApprovalChain: z.string().optional(),
  expenseTagOptions: z.array(z.string()).default([]),

  // General Settings
  defaultCurrency: z.string().default('USD'),
  defaultTimezone: z.string().default('UTC'),
  defaultTaxRate: z
    .union([
      z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 1, {
        message: 'Tax rate must be between 0 and 1',
      }),
      z.number().min(0).max(1),
    ])
    .optional()
    .nullable(),

  // Inventory Settings
  inventoryPolicy: z.nativeEnum(InventoryPolicy).default('FEFO'),
  lowStockThreshold: z
    .union([
      z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
        message: 'Must be a non-negative integer',
      }),
      z.number().int().min(0),
    ])
    .default(10),
  negativeStock: z.boolean().default(false),

  // Spatial Settings
  enableCapacityTracking: z.boolean().default(false),
  enforceSpatialConstraints: z.boolean().default(false),
  enableProductDimensions: z.boolean().default(false),
  defaultMeasurementUnit: z.nativeEnum(MeasurementUnit).optional().nullable(),
  defaultDimensionUnit: z.string().optional().nullable(),
  defaultWeightUnit: z.string().optional().nullable(),
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

interface EditOrganizationFormProps {
  onSuccess?: () => void;
}

export function EditOrganizationForm({onSuccess}: EditOrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { organization, isLoading, error} = useOrganization();
  const {mutate: updateOrganization, isPending: isUpdating} = useUpdateOrganization();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      logo: '',
      expenseApprovalRequired: false,
      expenseApprovalThreshold: null,
      expenseReceiptRequired: true,
      expenseReceiptThreshold: null,
      defaultExpenseCurrency: 'USD',
      expenseApprovalChain: undefined,
      expenseTagOptions: [],
      defaultCurrency: 'USD',
      defaultTimezone: 'UTC',
      defaultTaxRate: null,
      inventoryPolicy: 'FEFO',
      lowStockThreshold: '10',
      negativeStock: false,
      enableCapacityTracking: false,
      enforceSpatialConstraints: false,
      enableProductDimensions: false,
      defaultMeasurementUnit: null,
      defaultDimensionUnit: null,
      defaultWeightUnit: null,
    },
  });

  

  useEffect(() => {
    const loadOrganizationData = async () => {
      try {
        if (organization) {
          // Convert numeric values to strings for the form
          const formData = {
            ...organization,
            expenseApprovalThreshold: organization.expenseApprovalThreshold?.toString() || null,
            expenseReceiptThreshold: organization.expenseReceiptThreshold?.toString() || null,
            defaultTaxRate: organization.settings.defaultTaxRate?.toString() || null,
            lowStockThreshold: organization.settings.lowStockThreshold?.toString() || '10',
          };

          form.reset(formData);

          if (organization.logo) {
            setPreviewLogo(organization.logo);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to load organization data:', error);
        toast.error("Error loading organization data",{
          description: "Please try again later.",
        });
        setLoading(false);
      }
    };

    loadOrganizationData();
  }, [form]);

  const onSubmit = async (data: OrganizationFormValues) => {
    setIsSubmitting(true);
    try {
      // Convert form string values to appropriate types for API
      const apiData = {
        ...data,
        expenseApprovalThreshold: data.expenseApprovalThreshold
          ? parseFloat(data.expenseApprovalThreshold as string)
          : null,
        expenseReceiptThreshold: data.expenseReceiptThreshold
          ? parseFloat(data.expenseReceiptThreshold as string)
          : null,
        defaultTaxRate: data.defaultTaxRate ? parseFloat(data.defaultTaxRate as string) : null,
        lowStockThreshold: data.lowStockThreshold ? parseInt(data.lowStockThreshold as string) : 10,
      };

      await updateOrganization(apiData);

      toast.success( "Organization updated",{
        description: "Your organization settings have been updated successfully.",
      });

      if (onSuccess) {
        onSuccess();
      }

      router.refresh();
    } catch (error) {
      console.error('Failed to update organization:', error);
      toast.error("Error updating organization",{
        description: "There was an error updating your organization. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast( "Invalid file type",{
        description: "Please upload an image file (JPEG, PNG, SVG, or WebP).",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error( "File too large",{
        description: "Logo image must be less than 5MB.",
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

      toast("Logo uploaded",{
        description: "Your organization logo has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Logo upload failed:', error);
      toast( "Upload failed",{
        description: "There was an error uploading your logo. Please try again.",
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-72 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full max-w-xs mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="general" className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="spatial">Spatial</TabsTrigger>
              </TabsList>
              <Button type="submit" disabled={isSubmitting || uploadingLogo} className="ml-auto">
                {isSubmitting ? 'Saving changes...' : 'Save changes'}
              </Button>
            </div>

            {/* GENERAL SETTINGS TAB */}
            <TabsContent value="general" className="space-y-6">
              {/* Logo upload card */}
              <Card>
                <CardHeader>
                  <CardTitle>Organization Identity</CardTitle>
                  <CardDescription>Customize your organization&apos;s brand identity</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col space-y-4">
                    <div className="text-lg font-medium">Organization Logo</div>

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
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="h-10 w-10 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <Upload className="h-10 w-10 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload logo</p>
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
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Inc." {...field} className="h-11" />
                          </FormControl>
                          <FormDescription>This is your organization&apos;s display name.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization URL</FormLabel>
                          <FormControl>
                            <div className="flex items-center h-11">
                              <span className="px-3 bg-muted border-r border-input rounded-l-md h-full flex items-center text-muted-foreground">
                                domain.com/
                              </span>
                              <Input placeholder="acme" {...field} className="rounded-l-none h-full" />
                            </div>
                          </FormControl>
                          <FormDescription>This is your organization&apos;s unique URL identifier.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure default values for your organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="defaultCurrency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
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
                          <FormDescription>Default currency for transactions in your organization.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="defaultTimezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Timezone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
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
                          <FormDescription>Default timezone for your organization.</FormDescription>
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
                        <FormLabel>Default Tax Rate</FormLabel>
                        <FormControl>
                          <div className="flex h-11 items-center">
                            <Input
                              type="number"
                              step="0.0001"
                              min="0"
                              max="1"
                              placeholder="0.20"
                              {...field}
                              value={field.value || ''}
                              onChange={e => field.onChange(e.target.value)}
                              className="rounded-r-none"
                            />
                            <div className="h-full px-3 flex items-center bg-muted border border-l-0 border-input rounded-r-md">
                              <span className="text-muted-foreground">(20%)</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Default tax rate for products and services (e.g., 0.20 for 20%).
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
                        <FormLabel>Organization Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of your organization..."
                            className="resize-none min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Describe your organization in a few sentences.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* EXPENSES TAB */}
            <TabsContent value="expenses" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Management</CardTitle>
                  <CardDescription>Configure how expenses are handled within your organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="expenseApprovalRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require Expense Approval</FormLabel>
                            <FormDescription>Expenses must be approved before processing</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expenseReceiptRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require Expense Receipts</FormLabel>
                            <FormDescription>Receipts must be attached to expense claims</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                          <FormLabel>Approval Threshold</FormLabel>
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
                                onChange={e => field.onChange(e.target.value)}
                                className="rounded-l-none"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Expenses above this amount require approval. Leave blank for all expenses.
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
                          <FormLabel>Receipt Threshold</FormLabel>
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
                                onChange={e => field.onChange(e.target.value)}
                                className="rounded-l-none"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Expenses above this amount require receipts. Leave blank for all expenses.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="defaultExpenseCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Expense Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
                        <FormDescription>Default currency for expense claims.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expenseTagOptions"
                    render={() => (
                      <FormItem>
                        <FormLabel>Expense Tag Options</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <Input
                              placeholder="Add a tag and press Enter"
                              value={tagInput}
                              onChange={e => setTagInput(e.target.value)}
                              onKeyDown={handleAddTag}
                            />
                            <div className="flex flex-wrap gap-2">
                              {form.watch('expenseTagOptions')?.map(tag => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="flex items-center gap-1 px-3 py-1 text-sm"
                                >
                                  {tag}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 rounded-full"
                                    onClick={() => handleRemoveTag(tag)}
                                  >
                                    ×
                                  </Button>
                                </Badge>
                              ))}
                              {!form.watch('expenseTagOptions')?.length && (
                                <div className="text-sm text-muted-foreground italic">No tags defined yet</div>
                              )}
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>Define predefined tags for categorizing expenses.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expenseApprovalChain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approval Workflow</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='e.g., {"levels": [{"threshold": 100, "approvers": ["manager"]}, {"threshold": 1000, "approvers": ["manager", "finance"]}]}'
                            className="resize-none font-mono text-sm"
                            {...field}
                            value={field.value || ''}
                          />
                          <Textarea
                            placeholder='e.g., {"levels": [{"threshold": 100, "approvers": ["manager"]}, {"threshold": 1000, "approvers": ["manager", "finance"]}]}'
                            className="resize-none font-mono text-sm"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          JSON configuration for approval chain workflow. Leave blank to use default approvers.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* INVENTORY TAB */}
            <TabsContent value="inventory" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Management</CardTitle>
                  <CardDescription>Configure how inventory is tracked and managed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="inventoryPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inventory Policy</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a policy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FIFO">FIFO (First In, First Out)</SelectItem>
                              <SelectItem value="LIFO">LIFO (Last In, First Out)</SelectItem>
                              <SelectItem value="FEFO">FEFO (First Expired, First Out)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Determines how inventory is processed and consumed.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lowStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Threshold</FormLabel>
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
                          <FormDescription>Number of units at which low stock alerts are triggered.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="negativeStock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Allow Negative Stock</FormLabel>
                          <FormDescription>Allow selling products even when inventory is depleted</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="bg-muted/50 p-4 rounded-lg border border-muted">
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
                        dedicated Inventory Management section.
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SPATIAL TAB */}
            <TabsContent value="spatial" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Spatial Management</CardTitle>
                  <CardDescription>Configure how physical space and dimensions are tracked</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="enableCapacityTracking"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Capacity Tracking</FormLabel>
                            <FormDescription>Track and manage physical space capacity</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="enforceSpatialConstraints"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enforce Spatial Constraints</FormLabel>
                            <FormDescription>Prevent exceeding physical capacity limits</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="enableProductDimensions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Product Dimensions</FormLabel>
                          <FormDescription>Track physical dimensions of products</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                          <FormLabel>Default Measurement System</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a measurement system" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="METRIC">Metric</SelectItem>
                              <SelectItem value="IMPERIAL">Imperial</SelectItem>
                              <SelectItem value="CUSTOM">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Primary measurement system for your organization.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="defaultDimensionUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Dimension Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(MeasurementUnit)
                                // Filter for appropriate dimension units (adjust as needed)
                                .filter(
                                  value =>
                                    !value.startsWith('WEIGHT_') &&
                                    !value.startsWith('AREA_') &&
                                    !value.startsWith('VOLUME_')
                                )
                                .map(value => (
                                  <SelectItem key={value} value={value}>
                                    {value
                                      .replace('_', ' ')
                                      .toLowerCase()
                                      .replace(/\b\w/g, l => l.toUpperCase())}{' '}
                                    {/* Format display name */}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Default unit for measuring dimensions.</FormDescription>
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
                        <FormLabel>Default Weight Unit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(MeasurementUnit).map(unit => (
                              <SelectItem key={unit} value={unit} className="flex-1">
                                {unit.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Default unit for measuring weight.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Visualization Settings</CardTitle>
                  <CardDescription>Configure how spatial data is visualized in your organization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg border border-muted flex items-center gap-3">
                    <Ruler className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Spatial visualization settings are managed through the warehouse management interface. Enable
                      capacity tracking above to access these features.
                    </span>
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
