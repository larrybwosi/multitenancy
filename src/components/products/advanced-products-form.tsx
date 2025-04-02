"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Upload,
  Image as ImageIcon,
  Tag,
  Package,
  LayoutGrid,
  DollarSign,
  PercentIcon,
  Clipboard,
  Truck,
  Calendar,
  AlertCircle,
  BarChart,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Category } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Enhanced schema with enterprise features
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  buyingPrice: z.string().min(1, "Buying price is required"),
  sellingPrice: z.string().min(1, "Selling price is required"),
  wholeSalePrice: z.string().optional(),
  profitMargin: z.string().optional(),
  taxRate: z.string().optional(),
  taxType: z.string().optional(),
  taxExempt: z.boolean().default(false),
  category: z.string().min(1, "Category is required"),
  stock: z.string().optional(),
  minStockLevel: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  additionalImages: z.array(z.string()).default([]),
  supplier: z.string().optional(),
  supplierCode: z.string().optional(),
  supplierPrice: z.string().optional(),
  manufactureDate: z.date().optional(),
  expiryDate: z.date().optional(),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  location: z.string().optional(),
  status: z.string().default("active"),
  isPromoted: z.boolean().default(false),
  promotionPrice: z.string().optional(),
  promotionStartDate: z.date().optional(),
  promotionEndDate: z.date().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  variants: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      price: z.string().optional(),
    })
  ).default([]),
});

export const ProductForm = ({
  onSubmit,
  defaultValues,
  isSubmitting,
  categories,
  suppliers = [],
  taxRates = [],
}: {
  onSubmit: (values: z.infer<typeof productSchema>) => void;
  defaultValues?: any;
  isSubmitting: boolean;
  categories: Category[];
  suppliers?: Array<{ id: string; name: string }>;
  taxRates?: Array<{ id: string; name: string; rate: string }>;
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(
    defaultValues?.image || null
  );
  const [additionalImages, setAdditionalImages] = useState<string[]>(
    defaultValues?.additionalImages || []
  );
  const [calculatingProfit, setCalculatingProfit] = useState(false);
  const [variants, setVariants] = useState<
    { name: string; value: string; price?: string }[]
  >(defaultValues?.variants || []);
  const [newVariant, setNewVariant] = useState({
    name: "",
    value: "",
    price: "",
  });
  const [currentTag, setCurrentTag] = useState("");
  const [tags, setTags] = useState<string[]>(defaultValues?.tags || []);
  const [tempProfitMargin, setTempProfitMargin] = useState(
    defaultValues?.profitMargin || ""
  );

  const form = useForm<z.infer<typeof productSchema>>({
    defaultValues: {
      ...defaultValues,
      taxExempt: defaultValues?.taxExempt || false,
      isPromoted: defaultValues?.isPromoted || false,
      status: defaultValues?.status || "active",
      tags: defaultValues?.tags || [],
      variants: defaultValues?.variants || [],
      additionalImages: defaultValues?.additionalImages || [],
    },
  });

  // Calculate profit margin when buying or selling price changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (
        (name === "buyingPrice" || name === "sellingPrice") &&
        value.buyingPrice &&
        value.sellingPrice
      ) {
        const buying = parseFloat(value.buyingPrice as string);
        const selling = parseFloat(value.sellingPrice as string);

        if (buying > 0 && selling > 0) {
          setCalculatingProfit(true);
          const profit = selling - buying;
          const margin = (profit / selling) * 100;
          setTempProfitMargin(margin.toFixed(2));
          form.setValue("profitMargin", margin.toFixed(2));
          setTimeout(() => setCalculatingProfit(false), 500);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Profit calculation based on margin
  const calculateSellingPriceFromMargin = () => {
    const buyingPrice = parseFloat(form.getValues("buyingPrice"));
    const marginPercent = parseFloat(tempProfitMargin);

    if (buyingPrice > 0 && marginPercent > 0) {
      // Formula: selling price = buying price / (1 - margin/100)
      const sellingPrice = buyingPrice / (1 - marginPercent / 100);
      form.setValue("sellingPrice", sellingPrice.toFixed(2));
    }
  };

  // Handle main image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        form.setValue("image", result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle additional images upload
  const handleAdditionalImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setAdditionalImages((prev) => [...prev, result]);
          form.setValue("additionalImages", [...additionalImages, result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove additional image
  const removeAdditionalImage = (index: number) => {
    const newImages = additionalImages.filter((_, i) => i !== index);
    setAdditionalImages(newImages);
    form.setValue("additionalImages", newImages);
  };

  // Add variant
  const addVariant = () => {
    if (newVariant.name && newVariant.value) {
      const updatedVariants = [...variants, newVariant];
      setVariants(updatedVariants);
      form.setValue("variants", updatedVariants);
      setNewVariant({ name: "", value: "", price: "" });
    }
  };

  // Remove variant
  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
    form.setValue("variants", newVariants);
  };

  // Add tag
  const addTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      const newTags = [...tags, currentTag];
      setTags(newTags);
      form.setValue("tags", newTags);
      setCurrentTag("");
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    form.setValue("tags", newTags);
  };

  // Handle key press for tags
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Card className="w-full max-w-6xl shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-1 h-8 bg-blue-500 rounded-full mr-3"></div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {defaultValues ? "Edit Product" : "Add New Product"}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </SelectItem>
                      <SelectItem value="draft">
                        <Badge className="bg-gray-100 text-gray-800">
                          Draft
                        </Badge>
                      </SelectItem>
                      <SelectItem value="discontinued">
                        <Badge className="bg-red-100 text-red-800">
                          Discontinued
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="mb-6" />

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-6 bg-gray-100">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Tax</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
            <TabsTrigger value="additional">Additional Info</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Product Name *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Tag className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              <Input
                                placeholder="e.g. Premium Wireless Headphones"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Category *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <div className="relative">
                                <SelectTrigger className="w-full pl-10">
                                  <div className="absolute left-3 top-2.5">
                                    <LayoutGrid className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </div>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id.toString()}
                                >
                                  {category.name}
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
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Tags
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <div className="flex">
                                <div className="relative flex-grow">
                                  <Tag className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  <Input
                                    placeholder="Add product tags"
                                    className="pl-10"
                                    value={currentTag}
                                    onChange={(e) =>
                                      setCurrentTag(e.target.value)
                                    }
                                    onKeyPress={handleTagKeyPress}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  onClick={addTag}
                                  className="ml-2 bg-gray-200 hover:bg-gray-300 text-gray-800"
                                >
                                  Add
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {tags.map((tag, index) => (
                                  <Badge
                                    key={index}
                                    className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                                  >
                                    {tag}
                                    <button
                                      type="button"
                                      className="ml-1 text-blue-600 hover:text-blue-800"
                                      onClick={() => removeTag(tag)}
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Tags help customers find your product through search
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            SKU
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Tag className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              <Input
                                placeholder="e.g. PROD-12345"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Unique identifier for inventory tracking
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Barcode
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <BarChart className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              <Input
                                placeholder="e.g. 978020137962"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Description
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your product in detail..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Include key features, specifications, and other
                            details
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Pricing */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Pricing Information</h3>

                    <FormField
                      control={form.control}
                      name="buyingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Buying Price (Cost) *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <p className="absolute left-3 top-2.5 h-5 w-4 mr-2 text-sm text-gray-400">
                                KSH
                              </p>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="e.g. 75.00"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sellingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Selling Price (Retail) *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <p className="absolute left-3 top-2.5 h-5 w-4 mr-2 text-sm text-gray-400">
                                KSH
                              </p>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="e.g. 99.99"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="wholeSalePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Wholesale Price
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <p className="absolute left-3 top-2.5 h-5 w-4 mr-2 text-sm text-gray-400">
                                KSH
                              </p>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="e.g. 85.00"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Price for bulk purchases
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="border rounded-md p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel className="text-gray-700 font-medium">
                          Profit Margin (%)
                        </FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={calculateSellingPriceFromMargin}
                          className="h-8 text-xs"
                        >
                          Calculate Price
                        </Button>
                      </div>
                      <div className="relative">
                        <PercentIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10"
                          value={tempProfitMargin}
                          onChange={(e) => {
                            setTempProfitMargin(e.target.value);
                            form.setValue("profitMargin", e.target.value);
                          }}
                        />
                        {calculatingProfit && (
                          <div className="text-xs text-blue-600 mt-1 animate-pulse">
                            Calculating...
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Automatically calculated based on buying and selling
                        prices, or enter manually to calculate selling price
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Tax */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Tax Information</h3>

                    <FormField
                      control={form.control}
                      name="taxExempt"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                          <div className="space-y-0.5">
                            <FormLabel className="text-gray-700 font-medium">
                              Tax Exempt
                            </FormLabel>
                            <FormDescription>
                              Exclude this product from tax calculations
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {!form.watch("taxExempt") && (
                      <>
                        <FormField
                          control={form.control}
                          name="taxRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">
                                Tax Rate
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select tax rate" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {taxRates.map((tax) => (
                                    <SelectItem key={tax.id} value={tax.id}>
                                      {tax.name} ({tax.rate}%)
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="custom">
                                    Custom Rate
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
{/* 
                        {form.watch("taxRate") === "custom" && (
                          <FormField
                            control={form.control}
                            name="customTaxRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700 font-medium">
                                  Custom Tax Rate (%)
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <PercentIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="e.g. 16.00"
                                      className="pl-10"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )} */}

                        <FormField
                          control={form.control}
                          name="taxType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">
                                Tax Type
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select tax type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="inclusive">
                                    Tax Inclusive (included in price)
                                  </SelectItem>
                                  <SelectItem value="exclusive">
                                    Tax Exclusive (added to price)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-xs text-gray-500">
                                How tax is applied to the product price
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={form.control}
                      name="isPromoted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                          <div className="space-y-0.5">
                            <FormLabel className="text-gray-700 font-medium">
                              Promotional Pricing
                            </FormLabel>
                            <FormDescription>
                              Enable special promotional price
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("isPromoted") && (
                      <div className="space-y-4 border p-4 rounded-md">
                        <FormField
                          control={form.control}
                          name="promotionPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">
                                Promotion Price
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <p className="absolute left-3 top-2.5 h-5 w-4 mr-2 text-sm text-gray-400">
                                    KSH
                                  </p>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g. 79.99"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="promotionStartDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-gray-700 font-medium">
                                  Start Date
                                </FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={`w-full pl-3 text-left font-normal ${
                                          !field.value && "text-gray-400"
                                        }`}
                                      >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="promotionEndDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-gray-700 font-medium">
                                  End Date
                                </FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={`w-full pl-3 text-left font-normal ${
                                          !field.value && "text-gray-400"
                                        }`}
                                      >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="inventory" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Stock */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">
                      Inventory Management
                    </h3>

                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Current Stock
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Package className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              <Input
                                type="number"
                                placeholder="e.g. 100"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minStockLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Minimum Stock Level
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <AlertCircle className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              <Input
                                type="number"
                                placeholder="e.g. 10"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Receive alerts when stock falls below this level
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Right Column - Supplier */}
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Supplier
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a supplier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers.map((supplier) => (
                                <SelectItem
                                  key={supplier.id}
                                  value={supplier.id}
                                >
                                  {supplier.name}
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
                      name="supplierCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Supplier Code
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. SUP-12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="supplierPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Supplier Price
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <p className="absolute left-3 top-2.5 h-5 w-4 mr-2 text-sm text-gray-400">
                                KSH
                              </p>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="e.g. 70.00"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Main Image */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Product Image</h3>

                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Main Image
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-center justify-center w-full">
                              <label
                                htmlFor="image-upload"
                                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                              >
                                {previewImage ? (
                                  <img
                                    src={previewImage}
                                    alt="Product Preview"
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">
                                      <span className="font-semibold">
                                        Click to upload
                                      </span>{" "}
                                      or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      PNG, JPG, GIF up to 10MB
                                    </p>
                                  </div>
                                )}
                                <input
                                  id="image-upload"
                                  type="file"
                                  className="hidden"
                                  onChange={handleImageChange}
                                />
                              </label>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Right Column - Additional Images */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Additional Images</h3>

                    <FormField
                      control={form.control}
                      name="additionalImages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Additional Images
                          </FormLabel>
                          <FormControl>
                            <div className="flex flex-col space-y-4">
                              <div className="flex items-center justify-center w-full">
                                <label
                                  htmlFor="additional-images-upload"
                                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                                >
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">
                                      <span className="font-semibold">
                                        Click to upload
                                      </span>{" "}
                                      or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      PNG, JPG, GIF up to 10MB
                                    </p>
                                  </div>
                                  <input
                                    id="additional-images-upload"
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={handleAdditionalImageChange}
                                  />
                                </label>
                              </div>

                              {additionalImages.length > 0 && (
                                <div className="grid grid-cols-3 gap-4">
                                  {additionalImages.map((image, index) => (
                                    <div key={index} className="relative">
                                      <img
                                        src={image}
                                        alt={`Additional Image ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg"
                                      />
                                      <button
                                        type="button"
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        onClick={() =>
                                          removeAdditionalImage(index)
                                        }
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="variants" className="space-y-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Product Variants</h3>

                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <Input
                          placeholder="Variant Name"
                          value={variant.name}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[index].name = e.target.value;
                            setVariants(newVariants);
                          }}
                        />
                        <Input
                          placeholder="Variant Value"
                          value={variant.value}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[index].value = e.target.value;
                            setVariants(newVariants);
                          }}
                        />
                        <Input
                          placeholder="Price (optional)"
                          value={variant.price || ""}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[index].price = e.target.value;
                            setVariants(newVariants);
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => removeVariant(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}

                    <div className="flex items-center space-x-4">
                      <Input
                        placeholder="Variant Name"
                        value={newVariant.name}
                        onChange={(e) =>
                          setNewVariant({ ...newVariant, name: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Variant Value"
                        value={newVariant.value}
                        onChange={(e) =>
                          setNewVariant({
                            ...newVariant,
                            value: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Price (optional)"
                        value={newVariant.price}
                        onChange={(e) =>
                          setNewVariant({
                            ...newVariant,
                            price: e.target.value,
                          })
                        }
                      />
                      <Button type="button" onClick={addVariant}>
                        Add Variant
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="additional" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Dates */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Dates</h3>

                    <FormField
                      control={form.control}
                      name="manufactureDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-gray-700 font-medium">
                            Manufacture Date
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={`w-full pl-3 text-left font-normal ${
                                    !field.value && "text-gray-400"
                                  }`}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-gray-700 font-medium">
                            Expiry Date
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={`w-full pl-3 text-left font-normal ${
                                    !field.value && "text-gray-400"
                                  }`}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Right Column - Dimensions */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Dimensions & Weight</h3>

                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Weight (kg)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="e.g. 0.5"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dimensions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Dimensions (L x W x H)
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 10x5x2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Save Product"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
};