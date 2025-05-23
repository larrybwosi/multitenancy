'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Info,
  CheckCircle,
  AlertCircle,
  Clock,
  Archive,
  Upload,
  X,
  UploadCloud,
} from 'lucide-react';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { MotionDiv } from '@/components/motion';

// Schema and types
const organizationSchema = z.object({
  // Basic Information
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/i, 'Slug can only contain letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  logo: z.string().url('Must be a valid URL').optional(),

  // Financial Settings
  defaultCurrency: z.string(),
  taxRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Tax rate must be a valid percentage'),
  fiscalYearStart: z.string(),
  expenseApprovalThreshold: z.string().regex(/^\d+$/, 'Must be a positive number'),
  expenseReceiptThreshold: z.string().regex(/^\d+$/, 'Must be a positive number'),

  // Inventory Settings
  lowStockThreshold: z.string().regex(/^\d+$/, 'Must be a positive number'),
  inventoryTrackingEnabled: z.boolean().default(true),
  inventoryPolicy: z.enum(['FIFO', 'LIFO', 'FEFO']),

  // Contact Information
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  email: z.string().email('Must be a valid email'),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),

  // Additional Settings
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
  const [formData, setFormData] = useState<Partial<OrganizationForm>>({
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name) {
      const newSlug = slugify(formData.name);
      setFormData(prev => ({ ...prev, slug: newSlug }));
    }
  }, [formData.name]);

  // Create preview for selected file
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Clean up
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const validateField = (name: string, value: any) => {
    try {
      const fieldSchema = organizationSchema.shape[name as keyof typeof organizationSchema.shape];
      fieldSchema.parse(value);
      setErrors(prev => ({ ...prev, [name]: '' }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [name]: error.errors[0].message }));
      }
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      return;
    }

    const file = e.target.files[0];
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, logo: 'File must be an image' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: 'File size must be less than 5MB' }));
      return;
    }

    setSelectedFile(file);
    setErrors(prev => ({ ...prev, logo: '' }));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrors(prev => ({ ...prev, logo: '' }));

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

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

      handleInputChange('logo', data.url);
      setSelectedFile(null);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        logo: 'Failed to upload image. Please try again.',
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setSelectedFile(null);
    handleInputChange('logo', '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
console.log('Submitting form data:', formData);
    try {
      const res = organizationSchema.parse(formData);
      console.log(res)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
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
    <TooltipProvider>
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

              <div className="space-y-8">
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
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="name">Organization Name *</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>The official name of your organization</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={e => handleInputChange('name', e.target.value)}
                            placeholder="Enter organization name"
                            className={errors.name ? 'border-red-500' : ''}
                          />
                          {errors.name && (
                            <p className="text-sm text-red-500 flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{errors.name}</span>
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="slug">URL Slug *</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>URL-friendly version of your organization name</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="relative">
                            <Input
                              id="slug"
                              value={formData.slug}
                              onChange={e => handleInputChange('slug', e.target.value)}
                              placeholder="organization-slug"
                              className={errors.slug ? 'border-red-500' : ''}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <MotionDiv
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded"
                              >
                                yoursite.com/{formData.slug}
                              </MotionDiv>
                            </div>
                          </div>
                          {errors.slug && (
                            <p className="text-sm text-red-500 flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{errors.slug}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="description">Description</Label>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-slate-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Brief description of your organization (max 500 characters)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={e => handleInputChange('description', e.target.value)}
                          placeholder="Describe your organization..."
                          className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
                          rows={3}
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>
                            {errors.description && <span className="text-red-500">{errors.description}</span>}
                          </span>
                          <span>{formData.description?.length || 0}/500</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="logo">Organization Logo</Label>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-slate-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Upload your organization&#39;s logo image</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex flex-col space-y-4">
                          {/* Preview area */}
                          {(previewUrl || formData.logo) && (
                            <div className="relative w-32 h-32 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                              <Image
                                src={previewUrl || formData.logo || ''}
                                alt="Logo preview"
                                fill
                                className="object-contain p-2 bg-white dark:bg-slate-800"
                              />
                              <button
                                type="button"
                                onClick={handleRemoveLogo}
                                className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                                aria-label="Remove logo"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}

                          {/* Upload controls */}
                          {!formData.logo && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Label htmlFor="file-upload" className="cursor-pointer">
                                  <Button variant="outline" type="button" className="space-x-2">
                                    <UploadCloud className="h-4 w-4" />
                                    <span>{selectedFile ? 'Change File' : 'Select File'}</span>
                                  </Button>
                                </Label>
                                <input
                                  id="file-upload"
                                  type="file"
                                  accept="image/png,image/jpeg,image/jpg,image/gif"
                                  className="w-full cursor-pointer hidden"
                                  onChange={handleFileChange}
                                />

                                {selectedFile && (
                                  <Button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="space-x-2"
                                  >
                                    {isUploading ? (
                                      <>
                                        <Settings className="h-4 w-4 animate-spin" />
                                        <span>Uploading...</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Upload</span>
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">Recommended size: 500x500px, Max file size: 5MB</p>
                            </div>
                          )}

                          {errors.logo && (
                            <p className="text-sm text-red-500 flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{errors.logo}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </MotionDiv>

                {/* Rest of your form components remain the same */}
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
                        <div className="space-y-2">
                          <Label htmlFor="defaultCurrency">Default Currency *</Label>
                          <Select
                            value={formData.defaultCurrency}
                            onValueChange={value => handleInputChange('defaultCurrency', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {currencyOptions.map(currency => (
                                <SelectItem key={currency.value} value={currency.value}>
                                  {currency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="taxRate">Tax Rate (%) *</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Default tax rate for transactions (e.g., 8.25)</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="taxRate"
                            value={formData.taxRate}
                            onChange={e => handleInputChange('taxRate', e.target.value)}
                            placeholder="8.25"
                            className={errors.taxRate ? 'border-red-500' : ''}
                          />
                          {errors.taxRate && (
                            <p className="text-sm text-red-500 flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{errors.taxRate}</span>
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="fiscalYearStart">Fiscal Year Start *</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Month when your fiscal year begins</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select
                            value={formData.fiscalYearStart}
                            onValueChange={value => handleInputChange('fiscalYearStart', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              {monthOptions.map(month => (
                                <SelectItem key={month.value} value={month.value}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="expenseApprovalThreshold">Expense Approval Threshold *</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Expenses below this amount are auto-approved.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="expenseApprovalThreshold"
                            value={formData.expenseApprovalThreshold}
                            onChange={e => handleInputChange('expenseApprovalThreshold', e.target.value)}
                            placeholder="1000"
                            type="number"
                            min="0"
                            className={errors.expenseApprovalThreshold ? 'border-red-500' : ''}
                          />
                          {errors.expenseApprovalThreshold && (
                            <p className="text-sm text-red-500 flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{errors.expenseApprovalThreshold}</span>
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="expenseReceiptThreshold">Expense Receipt Threshold *</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Expenses above this amount require a receipt.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="expenseReceiptThreshold"
                            value={formData.expenseReceiptThreshold}
                            onChange={e => handleInputChange('expenseReceiptThreshold', e.target.value)}
                            placeholder="50"
                            type="number"
                            min="0"
                            className={errors.expenseReceiptThreshold ? 'border-red-500' : ''}
                          />
                          {errors.expenseReceiptThreshold && (
                            <p className="text-sm text-red-500 flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{errors.expenseReceiptThreshold}</span>
                            </p>
                          )}
                        </div>
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
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="lowStockThreshold">Low Stock Threshold *</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Minimum quantity before low stock alerts</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="lowStockThreshold"
                            value={formData.lowStockThreshold}
                            onChange={e => handleInputChange('lowStockThreshold', e.target.value)}
                            placeholder="10"
                            type="number"
                            min="0"
                            className={errors.lowStockThreshold ? 'border-red-500' : ''}
                          />
                          {errors.lowStockThreshold && (
                            <p className="text-sm text-red-500 flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{errors.lowStockThreshold}</span>
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="inventoryTrackingEnabled">Enable Inventory Tracking</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Track inventory levels and stock movements</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="flex items-center space-x-3 pt-2">
                            <Switch
                              id="inventoryTrackingEnabled"
                              checked={formData.inventoryTrackingEnabled}
                              onCheckedChange={checked => handleInputChange('inventoryTrackingEnabled', checked)}
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {formData.inventoryTrackingEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Archive className="h-4 w-4 text-slate-500" />
                          <Label htmlFor="inventoryPolicy">Inventory Policy</Label>
                        </div>
                        <Select
                          value={formData.inventoryPolicy}
                          onValueChange={value => handleInputChange('inventoryPolicy', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select inventory policy" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryPolicyOptions.map(policy => (
                              <SelectItem key={policy.value} value={policy.value}>
                                {policy.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-slate-500" />
                            <Label htmlFor="website">Website</Label>
                          </div>
                          <Input
                            id="website"
                            value={formData.website}
                            onChange={e => handleInputChange('website', e.target.value)}
                            placeholder="https://yourwebsite.com"
                            type="url"
                            className={errors.website ? 'border-red-500' : ''}
                          />
                          {errors.website && (
                            <p className="text-sm text-red-500 flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{errors.website}</span>
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-slate-500" />
                            <Label htmlFor="email">Email *</Label>
                          </div>
                          <Input
                            id="email"
                            value={formData.email}
                            onChange={e => handleInputChange('email', e.target.value)}
                            placeholder="contact@yourorg.com"
                            type="email"
                            className={errors.email ? 'border-red-500' : ''}
                          />
                          {errors.email && (
                            <p className="text-sm text-red-500 flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{errors.email}</span>
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-slate-500" />
                            <Label htmlFor="phone">Phone</Label>
                          </div>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={e => handleInputChange('phone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            type="tel"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-slate-500" />
                            <Label htmlFor="address">Address *</Label>
                          </div>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={e => handleInputChange('address', e.target.value)}
                            placeholder="123 Main St, City, State 12345"
                            className={errors.address ? 'border-red-500' : ''}
                          />
                          {errors.address && (
                            <p className="text-sm text-red-500 flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{errors.address}</span>
                            </p>
                          )}
                        </div>
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
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="autoCheckoutTime">Auto-Checkout Time (HH:mm)</Label>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-slate-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Set a time for automatic checkout of logged-in users.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="autoCheckoutTime"
                          value={formData.autoCheckoutTime}
                          onChange={e => handleInputChange('autoCheckoutTime', e.target.value)}
                          placeholder="HH:mm"
                          className={errors.autoCheckoutTime ? 'border-red-500' : ''}
                        />
                        {errors.autoCheckoutTime && (
                          <p className="text-sm text-red-500 flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>{errors.autoCheckoutTime}</span>
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </MotionDiv>

                {/* Submit Button */}
                <MotionDiv variants={cardVariants} className="flex justify-end pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[200px] h-12 text-base font-medium hover:scale-105 transition-all duration-200"
                    onClick={handleSubmit}
                  >
                    <MotionDiv
                      animate={isSubmitting ? { rotate: 360 } : { rotate: 0 }}
                      transition={{
                        duration: 1,
                        repeat: isSubmitting ? Infinity : 0,
                      }}
                      className="mr-2"
                    >
                      {isSubmitting ? <Settings className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                    </MotionDiv>
                    {isSubmitting ? 'Saving...' : 'Save Organization Settings'}
                  </Button>
                </MotionDiv>
              </div>
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
    </TooltipProvider>
  );
};

export default OrganizationForm;
