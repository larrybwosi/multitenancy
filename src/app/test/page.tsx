'use client';

import { useState } from 'react';
import { Camera, Info, Check, X, ChevronDown, Eye } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Mock enum values that would come from your actual schema
const MeasurementUnit = {
  CUBIC_METER: 'CUBIC_METER',
  CUBIC_FEET: 'CUBIC_FEET',
  SQUARE_METER: 'SQUARE_METER',
  SQUARE_FEET: 'SQUARE_FEET',
  METER: 'METER',
  FEET: 'FEET',
  COUNT: 'COUNT',
  WEIGHT_KG: 'WEIGHT_KG',
  WEIGHT_LB: 'WEIGHT_LB',
} as const;

const InventoryPolicy = {
  FIFO: 'FIFO',
  LIFO: 'LIFO',
  FEFO: 'FEFO',
  NONE: 'NONE',
} as const;

// Timezones list example
const timezones = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];

// Currencies list example
const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY'];

// Schema for step 1 (Organization Details)
const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(30, 'Slug must not exceed 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
  logo: z.any().optional(),
});

// Schema for step 2 (Expense Settings)
const expenseSchema = z.object({
  expenseApprovalRequired: z.boolean().default(false),
  expenseApprovalThreshold: z.number().min(0).optional().nullable(),
  expenseReceiptRequired: z.boolean().default(true),
  expenseReceiptThreshold: z.number().min(0).optional().nullable(),
  expenseTagOptions: z.array(z.string()).default([]),
});

// Schema for step 3 (General Settings)
const generalSchema = z.object({
  defaultCurrency: z.string().default('USD'),
  defaultTimezone: z.string().default('UTC'),
  defaultTaxRate: z.number().min(0).max(1).optional().nullable(),
});

// Schema for step 4 (Inventory & Spatial)
const inventorySpatialSchema = z.object({
  inventoryPolicy: z.nativeEnum(InventoryPolicy).default(InventoryPolicy.FEFO),
  lowStockThreshold: z.number().min(0).default(10),
  negativeStock: z.boolean().default(false),
  enableCapacityTracking: z.boolean().default(false),
  enforceSpatialConstraints: z.boolean().default(false),
  enableProductDimensions: z.boolean().default(false),
  defaultMeasurementUnit: z.nativeEnum(MeasurementUnit).default(MeasurementUnit.METER),
  defaultDimensionUnit: z.nativeEnum(MeasurementUnit).default(MeasurementUnit.METER),
  defaultWeightUnit: z.nativeEnum(MeasurementUnit).default(MeasurementUnit.WEIGHT_KG),
});

// Combined schema
const formSchema = organizationSchema.merge(expenseSchema).merge(generalSchema).merge(inventorySpatialSchema);

type FormValues = z.infer<typeof formSchema>;

const CreateOrganizationPage = () => {
  const [step, setStep] = useState(1);
  const [newTag, setNewTag] = useState('');

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      logo: null,
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

  const { watch, setValue, trigger } = form;
  const formData = watch();

  const handleAddTag = () => {
    if (newTag && !formData.expenseTagOptions.includes(newTag)) {
      setValue('expenseTagOptions', [...formData.expenseTagOptions, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setValue(
      'expenseTagOptions',
      formData.expenseTagOptions.filter(t => t !== tag)
    );
  };

  const formatSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('name', value);
    // Auto-generate slug if the user hasn't manually edited it
    if (formData.slug === formatSlug(formData.name)) {
      setValue('slug', formatSlug(value));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('slug', formatSlug(e.target.value));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('logo', URL.createObjectURL(file));
    } else {
      setValue('logo', null);
    }
  };

  const onSubmit = (data: FormValues) => {
    console.log('Form submitted:', data);
    // Submit to API
  };

  const nextStep = async () => {
    let isValid = false;

    if (step === 1) {
      isValid = await trigger(['name', 'slug', 'description']);
    } else {
      isValid = true;
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const resetForm = () => {
    form.reset();
    setStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      {/* Header */}
      <header className="bg-background shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-foreground">Create New Organization</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress indicators */}
          <div className="mb-8 space-y-2">
            <Progress value={(step / 4) * 100} className="h-2" />
            <div className="flex justify-between">
              <div className={`text-sm font-medium ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                Organization Details
              </div>
              <div className={`text-sm font-medium ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                Expense Settings
              </div>
              <div className={`text-sm font-medium ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                General Settings
              </div>
              <div className={`text-sm font-medium ${step >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
                Inventory & Spatial
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Step 1: Organization Details */}
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                    <p className="text-sm text-muted-foreground">Set up the basic information for your organization.</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                      {/* Logo upload */}
                      <div className="sm:col-span-6">
                        <FormField
                          control={form.control}
                          name="logo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Logo</FormLabel>
                              <div className="mt-1 flex items-center">
                                <Avatar className="h-24 w-24 border">
                                  <AvatarImage src={field.value} />
                                  <AvatarFallback className="bg-muted">
                                    <Camera className="h-8 w-8 text-muted-foreground" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="ml-5">
                                  <FormControl>
                                    <Input
                                      id="logo-upload"
                                      type="file"
                                      accept="image/*"
                                      className="sr-only"
                                      onChange={handleLogoChange}
                                    />
                                  </FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-2"
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                  >
                                    Upload a file
                                  </Button>
                                  <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB</p>
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Organization name */}
                      <div className="sm:col-span-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Organization Name <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Acme Inc."
                                  {...field}
                                  onChange={e => {
                                    field.onChange(e);
                                    handleNameChange(e);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>The official name of your organization.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Slug */}
                      <div className="sm:col-span-4">
                        <FormField
                          control={form.control}
                          name="slug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Slug <span className="text-destructive">*</span>
                              </FormLabel>
                              <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                  myapp.com/org/
                                </span>
                                <FormControl>
                                  <Input
                                    className="rounded-l-none"
                                    placeholder="acme-inc"
                                    {...field}
                                    onChange={e => {
                                      field.onChange(e);
                                      handleSlugChange(e);
                                    }}
                                  />
                                </FormControl>
                              </div>
                              <FormDescription>
                                Used for your organization&apos;s URL. Only lowercase letters, numbers, and hyphens.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Description */}
                      <div className="sm:col-span-6">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Brief description of your organization"
                                  className="resize-none"
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                              <div className="flex justify-between">
                                <FormDescription>Brief description of your organization.</FormDescription>
                                <span className="text-xs text-muted-foreground">{field.value?.length || 0}/500</span>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Expense Settings */}
              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Settings</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configure how expenses are managed within your organization.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                      {/* Expense Approval */}
                      <div className="sm:col-span-6">
                        <FormField
                          control={form.control}
                          name="expenseApprovalRequired"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Require expense approval</FormLabel>
                                <FormDescription>All expenses will require approval before processing.</FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        {formData.expenseApprovalRequired && (
                          <div className="mt-4 ml-7">
                            <FormField
                              control={form.control}
                              name="expenseApprovalThreshold"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Approval threshold</FormLabel>
                                  <div className="relative mt-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <span className="text-muted-foreground text-sm">$</span>
                                    </div>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        className="pl-7 pr-12"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        {...field}
                                        value={field.value || ''}
                                        onChange={e => {
                                          const value = e.target.value === '' ? null : Number(e.target.value);
                                          field.onChange(value);
                                        }}
                                      />
                                    </FormControl>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                      <span className="text-muted-foreground text-sm">USD</span>
                                    </div>
                                  </div>
                                  <FormDescription>
                                    Only expenses above this amount require approval. Leave empty to require approval
                                    for all expenses.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>

                      {/* Receipt Required */}
                      <div className="sm:col-span-6">
                        <FormField
                          control={form.control}
                          name="expenseReceiptRequired"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Require receipts</FormLabel>
                                <FormDescription>Expenses will require receipt attachments.</FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        {formData.expenseReceiptRequired && (
                          <div className="mt-4 ml-7">
                            <FormField
                              control={form.control}
                              name="expenseReceiptThreshold"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Receipt threshold</FormLabel>
                                  <div className="relative mt-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <span className="text-muted-foreground text-sm">$</span>
                                    </div>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        className="pl-7 pr-12"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        {...field}
                                        value={field.value || ''}
                                        onChange={e => {
                                          const value = e.target.value === '' ? null : Number(e.target.value);
                                          field.onChange(value);
                                        }}
                                      />
                                    </FormControl>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                      <span className="text-muted-foreground text-sm">USD</span>
                                    </div>
                                  </div>
                                  <FormDescription>
                                    Only expenses above this amount require receipts. Leave empty to require receipts
                                    for all expenses.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>

                      {/* Expense Tags */}
                      <div className="sm:col-span-6">
                        <FormField
                          control={form.control}
                          name="expenseTagOptions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expense Tags</FormLabel>
                              <FormDescription className="mb-2">
                                Define tags that can be applied to expenses for categorization.
                              </FormDescription>

                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  placeholder="Add new tag"
                                  value={newTag}
                                  onChange={e => setNewTag(e.target.value)}
                                />
                                <Button type="button" onClick={handleAddTag}>
                                  Add
                                </Button>
                              </div>

                              {field.value.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {field.value.map(tag => (
                                    <Badge key={tag} variant="secondary" className="gap-1">
                                      {tag}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="text-muted-foreground hover:text-foreground"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: General Settings */}
              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configure default organization settings for currency, timezone, and tax.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                      {/* Default Currency */}
                      <div className="sm:col-span-3">
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
                              <FormDescription>Primary currency for financial transactions.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Default Timezone */}
                      <div className="sm:col-span-3">
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
                              <FormDescription>Used for scheduling and reporting.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Default Tax Rate */}
                      <div className="sm:col-span-3">
                        <FormField
                          control={form.control}
                          name="defaultTaxRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Tax Rate</FormLabel>
                              <div className="relative mt-1">
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    {...field}
                                    value={field.value || ''}
                                    onChange={e => {
                                      const value = e.target.value === '' ? null : Number(e.target.value);
                                      field.onChange(value);
                                    }}
                                  />
                                </FormControl>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                  <span className="text-muted-foreground text-sm">%</span>
                                </div>
                              </div>
                              <FormDescription>
                                Applied to transactions by default. Enter as decimal (e.g., 0.1 for 10%).
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Inventory & Spatial Settings */}
              {step === 4 && (
                <div className="space-y-6">
                  {/* Inventory Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Inventory Settings</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Configure how inventory is managed within your organization.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                        {/* Inventory Policy */}
                        <div className="sm:col-span-3">
                          <FormField
                            control={form.control}
                            name="inventoryPolicy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Inventory Policy</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select inventory policy" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value={InventoryPolicy.FIFO}>FIFO (First In, First Out)</SelectItem>
                                    <SelectItem value={InventoryPolicy.LIFO}>LIFO (Last In, First Out)</SelectItem>
                                    <SelectItem value={InventoryPolicy.FEFO}>
                                      FEFO (First Expired, First Out)
                                    </SelectItem>
                                    <SelectItem value={InventoryPolicy.NONE}>None</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>Determines how inventory is consumed and managed.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Low Stock Threshold */}
                        <div className="sm:col-span-3">
                          <FormField
                            control={form.control}
                            name="lowStockThreshold"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Low Stock Threshold</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Triggers low stock alerts when inventory falls below this level.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Negative Stock */}
                        <div className="sm:col-span-6">
                          <FormField
                            control={form.control}
                            name="negativeStock"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Allow negative inventory</FormLabel>
                                  <FormDescription>
                                    Allow items to be withdrawn even when stock is at zero.
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Spatial Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Spatial Settings</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Configure space and dimension tracking for your organization.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                        {/* Capacity Tracking */}
                        <div className="sm:col-span-6">
                          <FormField
                            control={form.control}
                            name="enableCapacityTracking"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Enable capacity tracking</FormLabel>
                                  <FormDescription>
                                    Track storage capacity for locations and containers.
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Spatial Constraints */}
                        <div className="sm:col-span-6">
                          <FormField
                            control={form.control}
                            name="enforceSpatialConstraints"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Enforce spatial constraints</FormLabel>
                                  <FormDescription>
                                    Prevent exceeding capacity limits for locations and containers.
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Product Dimensions */}
                        <div className="sm:col-span-6">
                          <FormField
                            control={form.control}
                            name="enableProductDimensions"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Enable product dimensions</FormLabel>
                                  <FormDescription>Track physical dimensions and weight for products.</FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Measurement Units */}
                        {formData.enableProductDimensions && (
                          <>
                            <div className="sm:col-span-2">
                              <FormField
                                control={form.control}
                                name="defaultMeasurementUnit"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Default Measurement Unit</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value={MeasurementUnit.CUBIC_METER}>Cubic Meter</SelectItem>
                                        <SelectItem value={MeasurementUnit.CUBIC_FEET}>Cubic Feet</SelectItem>
                                        <SelectItem value={MeasurementUnit.SQUARE_METER}>Square Meter</SelectItem>
                                        <SelectItem value={MeasurementUnit.SQUARE_FEET}>Square Feet</SelectItem>
                                        <SelectItem value={MeasurementUnit.METER}>Meter</SelectItem>
                                        <SelectItem value={MeasurementUnit.FEET}>Feet</SelectItem>
                                        <SelectItem value={MeasurementUnit.COUNT}>Count</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>Default unit for volume measurements.</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <FormField
                                control={form.control}
                                name="defaultDimensionUnit"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Default Dimension Unit</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value={MeasurementUnit.METER}>Meter</SelectItem>
                                        <SelectItem value={MeasurementUnit.FEET}>Feet</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>Default unit for length, width, height.</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <FormField
                                control={form.control}
                                name="defaultWeightUnit"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Default Weight Unit</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value={MeasurementUnit.WEIGHT_KG}>Kilograms (kg)</SelectItem>
                                        <SelectItem value={MeasurementUnit.WEIGHT_LB}>Pounds (lb)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>Default unit for weight measurements.</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Form actions */}
              <div className="pt-5">
                <div className="flex justify-between">
                  <div>
                    {step > 1 && (
                      <Button type="button" variant="outline" onClick={prevStep}>
                        Back
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Reset
                    </Button>
                    {step < 4 ? (
                      <Button type="button" onClick={nextStep}>
                        Next
                      </Button>
                    ) : (
                      <Button type="submit">Create Organization</Button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </main>

      {/* Summary panel - fixed on the right side */}
      <div className="hidden lg:block fixed top-0 right-0 w-96 h-full bg-background shadow-lg border-l overflow-auto">
        <div className="px-6 py-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Organization Summary</h2>

          <div className="space-y-4">
            {/* Basic Info Preview */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Basic Information</h3>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={formData.logo} />
                      <AvatarFallback className="bg-muted">
                        <Camera className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{formData.name || 'Organization Name'}</p>
                      <p className="text-xs text-muted-foreground">myapp.com/org/{formData.slug || 'org-slug'}</p>
                    </div>
                  </div>
                  {formData.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{formData.description}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Progress */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Setup Progress</h3>
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Organization Details</span>
                    <span className={formData.name && formData.slug ? 'text-success' : 'text-warning'}>
                      {formData.name && formData.slug ? <Check className="h-4 w-4" /> : 'Required'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Expense Settings</span>
                    <span className="text-success">
                      <Check className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">General Settings</span>
                    <span className="text-success">
                      <Check className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Inventory & Spatial</span>
                    <span className="text-success">
                      <Check className="h-4 w-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tips */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Tips</h3>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription className="text-xs">
                  After creating your organization, you&apos;ll be able to invite team members and set up permissions.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrganizationPage;
