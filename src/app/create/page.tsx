'use client';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Package,
  Settings,
  CheckCircle,
  Clock,
  Archive,
  UploadCloud,
  X,
} from 'lucide-react';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Image from 'next/image';
import { MotionDiv } from '@/components/motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Schema and types
const organizationSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/i, 'Slug can only contain letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  logo: z.string().url('Must be a valid URL').optional(),
  defaultCurrency: z.string(),
  taxRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Tax rate must be a valid percentage'),
  fiscalYearStart: z.string(),
  expenseApprovalThreshold: z.string().regex(/^\d+$/, 'Must be a positive number'),
  expenseReceiptThreshold: z.string().regex(/^\d+$/, 'Must be a positive number'),
  lowStockThreshold: z.string().regex(/^\d+$/, 'Must be a positive number'),
  inventoryTrackingEnabled: z.boolean().default(true),
  inventoryPolicy: z.enum(['FIFO', 'LIFO', 'FEFO']),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  email: z.string().email('Must be a valid email'),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  autoCheckoutTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be in HH:mm format')
    .optional()
    .or(z.literal('')),
});

type OrganizationForm = z.infer<typeof organizationSchema>;

const currencyOptions = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
  { value: 'INR', label: 'Indian Rupee (INR)' },
  { value: 'CNY', label: 'Chinese Yuan (CNY)' },
  { value: 'KSH', label: 'Kenyan Shilling (KSH)' },
];

const monthOptions = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const inventoryPolicyOptions = [
  { value: 'FIFO', label: 'First-In, First-Out (FIFO)' },
  { value: 'LIFO', label: 'Last-In, First-Out (LIFO)' },
  { value: 'FEFO', label: 'First-Expired, First-Out (FEFO)' },
];

// Slugify function
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const OrganizationForm = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      logo: '',
      defaultCurrency: 'USD',
      taxRate: '',
      fiscalYearStart: '01',
      expenseApprovalThreshold: '',
      expenseReceiptThreshold: '',
      lowStockThreshold: '10',
      inventoryTrackingEnabled: true,
      inventoryPolicy: 'FIFO',
      website: '',
      email: '',
      phone: '',
      address: '',
      autoCheckoutTime: '',
    },
  });

  // Auto-generate slug from name
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name' && value.name) {
        form.setValue('slug', slugify(value.name));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Handle file selection and immediate upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setPreviewUrl(null);
      return;
    }

    const file = e.target.files[0];
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      form.setError('logo', { message: 'File must be an image' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      form.setError('logo', { message: 'File size must be less than 5MB' });
      return;
    }

    // Set preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Start upload
    setIsUploading(true);
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

      const data = await response.json();
      if (!data.url) {
        throw new Error('No URL returned');
      }

      form.setValue('logo', data.url);
      form.clearErrors('logo');
      //eslint-disable-next-line 
    } catch (error:any) {
      toast.error('Failed to upload image. Please try again.',{
        description: error instanceof Error ? error.message : error.message,
      });
      form.setError('logo', { message: 'Failed to upload image. Please try again.' });
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleRemoveLogo = () => {
    setPreviewUrl(null);
    form.setValue('logo', '');
    form.clearErrors('logo');
  };

  const onSubmit = async (data: OrganizationForm) => {
    console.log('Submitting form data:', data);
    try {
      // Simulate API call
      const res = await fetch('/api/organization/new-create',{
        method:'POST',
        body:JSON.stringify(data),
      })
      if (!res.ok) {
        toast.error('Failed to create organization. Please try again.');
        console.error('Error creating organization:', res.statusText);
        throw new Error('Failed to create organization');
      }
      const response = await res.json()
      console.log('Response:', response)
      router.push(`/dashboard`)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex">
          <MotionDiv
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full lg:w-3/5 space-y-8 pr-8"
          >
            {/* Header */}
            <MotionDiv variants={cardVariants} className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Organization Settings</h1>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                Configure your organization&#39;s basic information, financial settings, and contact details
              </p>
            </MotionDiv>

            {/* Success Alert */}
            <AnimatePresence>
              {submitSuccess && (
                <MotionDiv
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Organization settings saved successfully!
                    </AlertDescription>
                  </Alert>
                </MotionDiv>
              )}
            </AnimatePresence>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Information */}
                <MotionDiv variants={cardVariants}>
                  <Card className="hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <CardTitle className="text-xl">Basic Information</CardTitle>
                      </div>
                      <CardDescription>Set up your organization&#39;s core identity and branding</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter organization name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="slug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL Slug *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input placeholder="organization-slug" {...field} />
                                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <MotionDiv
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded"
                                    >
                                      yoursite.com/{field.value}
                                    </MotionDiv>
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (max 500 characters)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your organization..."
                                className="resize-none"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-slate-500">
                              <span />
                              <span>{field.value?.length || 0}/500</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Logo</FormLabel>
                            <FormControl>
                              <div className="space-y-4">
                                {/* Preview area */}
                                {(previewUrl || field.value) && (
                                  <div className="relative w-48 h-48 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                                    <Image
                                      src={previewUrl || field.value || ''}
                                      alt="Logo preview"
                                      fill
                                      className="object-contain p-2 bg-white dark:bg-slate-800"
                                    />
                                    <button
                                      type="button"
                                      onClick={handleRemoveLogo}
                                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                                      aria-label="Remove logo"
                                    >
                                      <X className="h-5 w-5" />
                                    </button>
                                  </div>
                                )}
                                {/* Upload controls */}
                                <div className="flex items-center space-x-4">
                                  <Label
                                    htmlFor="file-upload"
                                    className="cursor-pointer flex items-center space-x-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                  >
                                    <UploadCloud className="h-5 w-5" />
                                    <span>{previewUrl || field.value ? 'Change Logo' : 'Select Logo'}</span>
                                  </Label>
                                  <input
                                    id="file-upload"
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/gif"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isUploading}
                                  />
                                  {isUploading && (
                                    <div className="flex items-center space-x-2">
                                      <Settings className="h-5 w-5 animate-spin" />
                                      <span className="text-sm">Uploading...</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">
                                  Recommended size: 500x500px, Max file size: 5MB
                                </p>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </MotionDiv>

                {/* Financial Settings */}
                <MotionDiv variants={cardVariants}>
                  <Card className="hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <CardTitle className="text-xl">Financial Settings</CardTitle>
                      </div>
                      <CardDescription>Configure currency, tax rates, and fiscal year settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="defaultCurrency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Currency *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {currencyOptions.map(currency => (
                                    <SelectItem key={currency.value} value={currency.value}>
                                      {currency.label}
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
                          name="taxRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default tax rate for transactions (e.g., 8.25) *</FormLabel>
                              <FormControl>
                                <Input placeholder="8.25" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fiscalYearStart"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Month when your fiscal year begins *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select month" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {monthOptions.map(month => (
                                    <SelectItem key={month.value} value={month.value}>
                                      {month.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
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
                              <FormLabel>Expenses below this amount are auto-approved *</FormLabel>
                              <FormControl>
                                <Input placeholder="1000" type="number" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="expenseReceiptThreshold"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expenses above this amount require a receipt *</FormLabel>
                              <FormControl>
                                <Input placeholder="50" type="number" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </MotionDiv>

                {/* Inventory Settings */}
                <MotionDiv variants={cardVariants}>
                  <Card className="hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-2">
                        <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <CardTitle className="text-xl">Inventory Settings</CardTitle>
                      </div>
                      <CardDescription>Configure inventory tracking and stock management</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="lowStockThreshold"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum quantity before low stock alerts *</FormLabel>
                              <FormControl>
                                <Input placeholder="10" type="number" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="inventoryTrackingEnabled"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Track inventory levels and stock movements</FormLabel>
                              <FormControl>
                                <div className="flex items-center space-x-3 pt-2">
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {field.value ? 'Enabled' : 'Disabled'}
                                  </span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="inventoryPolicy"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <Archive className="h-4 w-4 text-slate-500" />
                              <FormLabel>Inventory Policy</FormLabel>
                            </div>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select inventory policy" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {inventoryPolicyOptions.map(policy => (
                                  <SelectItem key={policy.value} value={policy.value}>
                                    {policy.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </MotionDiv>

                {/* Contact Information */}
                <MotionDiv variants={cardVariants}>
                  <Card className="hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        <CardTitle className="text-xl">Contact Information</CardTitle>
                      </div>
                      <CardDescription>Add your organization&#39;s contact details and social presence</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center space-x-2">
                                <Globe className="h-4 w-4 text-slate-500" />
                                <FormLabel>Website</FormLabel>
                              </div>
                              <FormControl>
                                <Input placeholder="https://yourwebsite.com" type="url" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-slate-500" />
                                <FormLabel>Email *</FormLabel>
                              </div>
                              <FormControl>
                                <Input placeholder="contact@yourorg.com" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-slate-500" />
                                <FormLabel>Phone</FormLabel>
                              </div>
                              <FormControl>
                                <Input placeholder="+1 (555) 123-4567" type="tel" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-slate-500" />
                                <FormLabel>Address *</FormLabel>
                              </div>
                              <FormControl>
                                <Input placeholder="123 Main St, City, State 12345" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </MotionDiv>

                {/* Additional Settings */}
                <MotionDiv variants={cardVariants}>
                  <Card className="hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <CardTitle className="text-xl">Additional Settings</CardTitle>
                      </div>
                      <CardDescription>Optional settings for your organization</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="autoCheckoutTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Set a time for automatic checkout of logged-in users</FormLabel>
                            <FormControl>
                              <Input placeholder="HH:mm" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </MotionDiv>

                {/* Submit Button */}
                <MotionDiv variants={cardVariants} className="flex justify-end pt-6">
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting || isUploading}
                    className="min-w-[200px] h-12 text-base font-medium hover:scale-105 transition-all duration-200"
                  >
                    <MotionDiv
                      animate={form.formState.isSubmitting ? { rotate: 360 } : { rotate: 0 }}
                      transition={{
                        duration: 1,
                        repeat: form.formState.isSubmitting ? Infinity : 0,
                      }}
                      className="mr-2"
                    >
                      {form.formState.isSubmitting ? (
                        <Settings className="h-5 w-5" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                    </MotionDiv>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Organization Settings'}
                  </Button>
                </MotionDiv>
              </form>
            </Form>
          </MotionDiv>
          <div className="hidden lg:block w-2/5 pl-8">
            <div className="sticky top-8">
              <Image
                width={1024}
                height={1024}
                src="https://cdn.sanity.io/images/7rkl59hi/production/d8ea510f70826369e9f7eb1b9c65bae870cdaf0c-1024x1024.jpg?fm=webp&q=75&auto=format"
                alt="Organization"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationForm;
