"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Building,
  Save,
  DollarSign,
  Package,
  Globe,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import slugify from "slugify";
import { appService } from "@/store/service";

// Define form schema using Zod
const organizationSchema = z.object({
  // Basic Information
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50)
    .regex(
      /^[a-z0-9-]+$/i,
      "Slug can only contain letters, numbers, and hyphens"
    ),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),

  // Financial Settings
  defaultCurrency: z.string(),
  taxRate: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Tax rate must be a valid percentage"),
  fiscalYearStart: z.string(),

  // Inventory Settings
  lowStockThreshold: z.string().regex(/^\d+$/, "Must be a positive number"),
  inventoryTrackingEnabled: z.boolean().default(true),

  // Contact Information
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

type OrganizationForm = z.infer<typeof organizationSchema>;

const currencyOptions = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "INR", label: "Indian Rupee (INR)" },
  { value: "CNY", label: "Chinese Yuan (CNY)" },
];

const tabs = ["basic", "financial", "inventory", "contact"];

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [slugPreview, setSlugPreview] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      logo: "",
      defaultCurrency: "USD",
      taxRate: "0.00",
      fiscalYearStart: "01-01",
      lowStockThreshold: "10",
      inventoryTrackingEnabled: true,
      website: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const nameValue = watch("name");
  const slugValue = watch("slug");

  // Generate slug preview when name changes
  useEffect(() => {
    if (nameValue && !slugValue) {
      const generatedSlug = slugify(nameValue, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });
      setSlugPreview(generatedSlug);
    }
  }, [nameValue, slugValue]);

  const onSubmit = async (data: OrganizationForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create organization");
      }
      const res = await response.json();

      appService.setOrganization(res.organization);
      appService.setCurrentWarehouse(res.warehouse);
      router.push("/dashboard"); // Redirect to organizations list or dashboard
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCurrencyChange = (value: string) => {
    setValue("defaultCurrency", value);
  };

  const handleInventoryTrackingChange = (checked: boolean) => {
    setValue("inventoryTrackingEnabled", checked);
  };

  const handleNext = async () => {
    // Validate current tab fields before proceeding
    const currentTabFields = {
      basic: ["name", "slug", "description", "logo"],
      financial: ["defaultCurrency", "taxRate", "fiscalYearStart"],
      inventory: ["lowStockThreshold", "inventoryTrackingEnabled"],
      contact: ["website", "email", "phone", "address"],
    }[activeTab];
    
    //eslint-disable-next-line
    const isValid = await trigger(currentTabFields as any);
    if (isValid) {
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    }
  };

  const handlePrevious = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const isLastTab = activeTab === tabs[tabs.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Form Section */}
          <div className="lg:col-span-3">
            <Card className="shadow-xl border-t-4 border-blue-500">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                  <Building className="h-6 w-6 text-blue-500" />
                  Create New Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-4 mb-6">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="financial">Financial</TabsTrigger>
                      <TabsTrigger value="inventory">Inventory</TabsTrigger>
                      <TabsTrigger value="contact">Contact</TabsTrigger>
                    </TabsList>

                    {/* Basic Information Tab */}
                    <TabsContent value="basic" className="space-y-6">
                      {/* Name Field */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className="text-gray-700 font-medium"
                        >
                          Organization Name*
                        </Label>
                        <Input
                          id="name"
                          placeholder="Acme Corp"
                          {...register("name")}
                          className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                          <p className="text-red-500 text-sm">
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      {/* Slug Field */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="slug"
                          className="text-gray-700 font-medium"
                        >
                          Slug*
                        </Label>
                        <div className="flex items-center">
                          <span className="bg-gray-100 p-2 text-gray-500 border border-r-0 rounded-l-md">
                            org/
                          </span>
                          <Input
                            id="slug"
                            placeholder="acme-corp"
                            {...register("slug")}
                            className={`rounded-l-none ${errors.slug ? "border-red-500" : ""}`}
                            value={slugValue || slugPreview}
                            onChange={(e) => {
                              setValue(
                                "slug",
                                slugify(e.target.value, {
                                  lower: true,
                                  strict: true,
                                  remove: /[*+~.()'"!:@]/g,
                                })
                              );
                            }}
                          />
                        </div>
                        {errors.slug && (
                          <p className="text-red-500 text-sm">
                            {errors.slug.message}
                          </p>
                        )}
                        {slugPreview && !slugValue && (
                          <p className="text-gray-500 text-sm">
                            Suggested slug:{" "}
                            <span className="font-mono">org/{slugPreview}</span>
                          </p>
                        )}
                      </div>

                      {/* Description Field */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="description"
                          className="text-gray-700 font-medium"
                        >
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your organization..."
                          {...register("description")}
                          className={`min-h-[120px] ${errors.description ? "border-red-500" : ""}`}
                        />
                        {errors.description && (
                          <p className="text-red-500 text-sm">
                            {errors.description.message}
                          </p>
                        )}
                      </div>

                      {/* Logo URL Field */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="logo"
                          className="text-gray-700 font-medium"
                        >
                          Logo URL
                        </Label>
                        <Input
                          id="logo"
                          type="url"
                          placeholder="https://example.com/logo.png"
                          {...register("logo")}
                          className={errors.logo ? "border-red-500" : ""}
                        />
                        {errors.logo && (
                          <p className="text-red-500 text-sm">
                            {errors.logo.message}
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    {/* Other Tabs remain the same... */}
                    {/* Financial Settings Tab */}
                    {/* Financial Settings Tab */}
                    <TabsContent value="financial" className="space-y-6">
                      {/* Default Currency Field */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="defaultCurrency"
                          className="text-gray-700 font-medium"
                        >
                          Default Currency*
                        </Label>
                        <Select
                          onValueChange={handleCurrencyChange}
                          defaultValue={watch("defaultCurrency")}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencyOptions.map((currency) => (
                              <SelectItem
                                key={currency.value}
                                value={currency.value}
                              >
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.defaultCurrency && (
                          <p className="text-red-500 text-sm">
                            {errors.defaultCurrency.message}
                          </p>
                        )}
                      </div>

                      {/* Tax Rate Field */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="taxRate"
                          className="text-gray-700 font-medium"
                        >
                          Default Tax Rate (%)*
                        </Label>
                        <div className="flex items-center">
                          <Input
                            id="taxRate"
                            placeholder="0.00"
                            {...register("taxRate")}
                            className={errors.taxRate ? "border-red-500" : ""}
                          />
                          <span className="ml-2 text-gray-500">%</span>
                        </div>
                        {errors.taxRate && (
                          <p className="text-red-500 text-sm">
                            {errors.taxRate.message}
                          </p>
                        )}
                      </div>

                      {/* Fiscal Year Start */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="fiscalYearStart"
                          className="text-gray-700 font-medium"
                        >
                          Fiscal Year Start Date*
                        </Label>
                        <Input
                          id="fiscalYearStart"
                          placeholder="MM-DD"
                          {...register("fiscalYearStart")}
                          className={
                            errors.fiscalYearStart ? "border-red-500" : ""
                          }
                        />
                        {errors.fiscalYearStart && (
                          <p className="text-red-500 text-sm">
                            {errors.fiscalYearStart.message}
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    {/* Inventory Settings Tab */}
                    <TabsContent value="inventory" className="space-y-6">
                      {/* Low Stock Threshold */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="lowStockThreshold"
                          className="text-gray-700 font-medium"
                        >
                          Low Stock Threshold*
                        </Label>
                        <Input
                          id="lowStockThreshold"
                          type="number"
                          placeholder="10"
                          {...register("lowStockThreshold")}
                          className={
                            errors.lowStockThreshold ? "border-red-500" : ""
                          }
                        />
                        {errors.lowStockThreshold && (
                          <p className="text-red-500 text-sm">
                            {errors.lowStockThreshold.message}
                          </p>
                        )}
                        <p className="text-gray-500 text-sm">
                          Items with stock below this number will be marked as
                          low stock
                        </p>
                      </div>

                      {/* Inventory Tracking Toggle */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-gray-700 font-medium">
                              Enable Inventory Tracking
                            </Label>
                            <p className="text-gray-500 text-sm">
                              Automatically track stock levels for all products
                            </p>
                          </div>
                          <Switch
                            checked={watch("inventoryTrackingEnabled")}
                            onCheckedChange={handleInventoryTrackingChange}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Contact Information Tab */}
                    <TabsContent value="contact" className="space-y-6">
                      {/* Website Field */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="website"
                          className="text-gray-700 font-medium"
                        >
                          Website
                        </Label>
                        <div className="flex items-center">
                          <Globe className="mr-2 h-4 w-4 text-gray-500" />
                          <Input
                            id="website"
                            placeholder="https://example.com"
                            {...register("website")}
                            className={errors.website ? "border-red-500" : ""}
                          />
                        </div>
                        {errors.website && (
                          <p className="text-red-500 text-sm">
                            {errors.website.message}
                          </p>
                        )}
                      </div>

                      {/* Email Field */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-gray-700 font-medium"
                        >
                          Email Address
                        </Label>
                        <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-gray-500" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="contact@example.com"
                            {...register("email")}
                            className={errors.email ? "border-red-500" : ""}
                          />
                        </div>
                        {errors.email && (
                          <p className="text-red-500 text-sm">
                            {errors.email.message}
                          </p>
                        )}
                      </div>

                      {/* Phone Field */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="phone"
                          className="text-gray-700 font-medium"
                        >
                          Phone Number
                        </Label>
                        <div className="flex items-center">
                          <Phone className="mr-2 h-4 w-4 text-gray-500" />
                          <Input
                            id="phone"
                            placeholder="+1 (123) 456-7890"
                            {...register("phone")}
                            className={errors.phone ? "border-red-500" : ""}
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-red-500 text-sm">
                            {errors.phone.message}
                          </p>
                        )}
                      </div>

                      {/* Address Field */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="address"
                          className="text-gray-700 font-medium"
                        >
                          Address
                        </Label>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                          <Textarea
                            id="address"
                            placeholder="123 Main St, City, Country"
                            {...register("address")}
                            className={errors.address ? "border-red-500" : ""}
                          />
                        </div>
                        {errors.address && (
                          <p className="text-red-500 text-sm">
                            {errors.address.message}
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Error Alert */}
                  {error && (
                    <Alert variant="destructive" className="mt-6">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Footer with navigation and submit */}
                  <div className="flex items-center justify-between pt-6 border-t mt-6">
                    <div className="flex space-x-2">
                      {activeTab !== tabs[0] && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrevious}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                      )}

                      {!isLastTab && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleNext}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>

                    {/* Submit Button */}
                    {isLastTab ? (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Create Organization
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleNext}
                        variant="default"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Image and Information Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-t-4 border-blue-500 sticky top-6">
              <div className="aspect-video relative overflow-hidden rounded-t-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 to-indigo-600/90 flex items-center justify-center">
                  <Image
                    src="https://cdn.sanity.io/images/7rkl59hi/production/90692709b593f4ddb6765bf69aab47f46e78b1b1-1339x905.jpg?fm=webp&q=75&auto=format"
                    alt="Organization Setup"
                    width={800}
                    height={400}
                    className="object-cover mix-blend-overlay"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                    <Building className="h-16 w-16 mb-4" />
                    <h3 className="text-2xl font-bold text-center">
                      Build Your Organization
                    </h3>
                    <p className="text-center mt-2 max-w-xs">
                      Set up your organization profile with all the essential
                      details
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Why these details matter
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Financial Settings
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Set your default currency and tax rate to ensure
                        accurate financial reporting from day one.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Inventory Management
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Configure inventory tracking and low stock alerts to
                        maintain optimal stock levels.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Globe className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Contact Information
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Your organization&apos;s contact details will be used on
                        invoices, reports, and customer communications.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                    <p className="text-amber-800 text-sm">
                      Make sure to fill in all required fields marked with an
                      asterisk (*). You can always update these settings later.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
