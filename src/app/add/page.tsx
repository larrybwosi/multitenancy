'use client'

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ChefHat,
  Plus,
  Minus,
  Upload,
  UploadCloud,
  DollarSign,
  Save,
  Calendar,
  Star,
  Clock,
  Users,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  ImageIcon,
  Package,
  Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Zod schema for form validation
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  price: z.string().min(1, 'Price is required').regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  discountPrice: z.string().optional(),
  discount: z.string().optional(),
  minimumOrder: z.number().min(1, 'Minimum order must be at least 1'),
  stock: z.string().optional(),
  sku: z.string().optional(),
  preparationTime: z.string().min(1, 'Preparation time is required'),
  spiceLevel: z.string(),
  isVegetarian: z.boolean(),
  isVegan: z.boolean(),
  isGlutenFree: z.boolean(),
  calories: z.string().optional(),
  allergens: z.array(z.string()),
  variants: z.array(z.object({
    name: z.string().min(1, 'Variant name is required'),
    price: z.string().min(1, 'Variant price is required'),
    description: z.string().optional(),
  })).min(1, 'At least one variant is required'),
});

type ProductFormData = z.infer<typeof productSchema>;

const RestaurantProductAdd = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      subCategory: '',
      price: '',
      discountPrice: '',
      discount: '',
      minimumOrder: 1,
      stock: '',
      sku: '',
      preparationTime: '',
      spiceLevel: 'mild',
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      calories: '',
      allergens: [],
      variants: [{ name: 'Regular', price: '', description: '' }],
    },
  });

  const { handleSubmit, control, watch, setValue, getValues } = form;
  const watchedVariants = watch('variants');

  const onSubmit = (data: ProductFormData) => {
    console.log('Form submitted:', data);
    // Handle form submission here
  };

  const addVariant = () => {
    const currentVariants = getValues('variants');
    setValue('variants', [...currentVariants, { name: '', price: '', description: '' }]);
  };

  const removeVariant = (index: number) => {
    const currentVariants = getValues('variants');
    if (currentVariants.length > 1) {
      setValue(
        'variants',
        currentVariants.filter((_, i) => i !== index)
      );
    }
  };

  const handleImageUpload = (file: File) => {
    // Simulate image upload
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
  };

  const categories = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Soups', 'Salads', 'Sides', 'Specials'];
  const subcategories = {
    'Main Courses': ['Pasta', 'Pizza', 'Burgers', 'Seafood', 'Steaks', 'Chicken', 'Vegetarian'],
    Appetizers: ['Hot Appetizers', 'Cold Appetizers', 'Sharing Platters'],
    Beverages: ['Hot Drinks', 'Cold Drinks', 'Alcoholic', 'Fresh Juices'],
    Desserts: ['Cakes', 'Ice Cream', 'Pastries', 'Seasonal'],
  };
  const allergensList = ['Gluten', 'Dairy', 'Nuts', 'Peanuts', 'Soy', 'Eggs', 'Fish', 'Shellfish'];

  const selectedCategory = watch('category');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                  <ChefHat className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    Add New Menu Item
                  </h1>
                  <p className="text-slate-600 text-lg">Create delicious dishes for your customers</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" size="lg" className="hover:bg-slate-50 transition-colors">
                  <Eye className="w-5 h-5 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={handleSubmit(onSubmit)}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Product
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Main Content Area */}
              <div className="xl:col-span-3 space-y-8">
                {/* Basic Information */}
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Info className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-2xl text-slate-800">Basic Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <FormField
                          control={control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Product Name *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., Margherita Pizza"
                                  className="h-12 text-lg border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <FormField
                          control={control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Describe your delicious dish in detail..."
                                  className="min-h-24 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors resize-y"
                                />
                              </FormControl>
                              <FormDescription>
                                A detailed description helps customers understand what makes your dish special.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Category *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 border-2 hover:border-blue-300">
                                  <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map(cat => (
                                  <SelectItem key={cat} value={cat}>
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="subCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Sub-Category</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={
                                !selectedCategory || !subcategories[selectedCategory as keyof typeof subcategories]
                              }
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 border-2 hover:border-blue-300">
                                  <SelectValue placeholder="Select Sub-Category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {selectedCategory &&
                                  subcategories[selectedCategory as keyof typeof subcategories]?.map(sub => (
                                    <SelectItem key={sub} value={sub}>
                                      {sub}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Information */}
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-2xl text-slate-800">Pricing</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Base Price ($) *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="h-12 pl-12 text-lg border-2 hover:border-green-300 focus:border-green-500 transition-colors"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="discountPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Discount Price ($)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="h-12 pl-12 text-lg border-2 hover:border-green-300 focus:border-green-500 transition-colors"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Discount (%)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="0"
                                max="100"
                                className="h-12 text-lg border-2 hover:border-green-300 focus:border-green-500 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="minimumOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Minimum Order Quantity</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="1"
                                onChange={e => field.onChange(parseInt(e.target.value))}
                                className="h-12 text-lg border-2 hover:border-green-300 focus:border-green-500 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Product Variants */}
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Star className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-2xl text-slate-800">Product Variants</span>
                      </div>
                      <Button
                        type="button"
                        onClick={addVariant}
                        variant="outline"
                        size="sm"
                        className="hover:bg-purple-50 border-purple-200 hover:border-purple-300"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Variant
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {watchedVariants.map((_, index) => (
                        <div
                          key={index}
                          className="p-6 bg-slate-50 rounded-xl border-2 border-slate-200 hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <Badge variant="secondary" className="text-sm">
                              Variant {index + 1}
                            </Badge>
                            {watchedVariants.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removeVariant(index)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={control}
                              name={`variants.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Variant Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="e.g., Small, Large"
                                      className="border-2 hover:border-purple-300 focus:border-purple-500"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={control}
                              name={`variants.${index}.price`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      className="border-2 hover:border-purple-300 focus:border-purple-500"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={control}
                              name={`variants.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description (Optional)</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Brief description"
                                      className="border-2 hover:border-purple-300 focus:border-purple-500"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Product Details */}
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="text-2xl text-slate-800">Product Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <FormField
                        control={control}
                        name="preparationTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Preparation Time (minutes) *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                  {...field}
                                  type="number"
                                  placeholder="15"
                                  className="h-12 pl-12 text-lg border-2 hover:border-orange-300 focus:border-orange-500 transition-colors"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="calories"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Calories (per serving)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="250"
                                className="h-12 text-lg border-2 hover:border-orange-300 focus:border-orange-500 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Stock Quantity</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                  {...field}
                                  type="number"
                                  placeholder="100"
                                  className="h-12 pl-12 text-lg border-2 hover:border-orange-300 focus:border-orange-500 transition-colors"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="spiceLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Spice Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 border-2 hover:border-orange-300">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mild">🌶️ Mild</SelectItem>
                                <SelectItem value="medium">🌶️🌶️ Medium</SelectItem>
                                <SelectItem value="hot">🌶️🌶️🌶️ Hot</SelectItem>
                                <SelectItem value="very-hot">🌶️🌶️🌶️🌶️ Very Hot</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">SKU (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="PROD-001"
                                className="h-12 text-lg border-2 hover:border-orange-300 focus:border-orange-500 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-4">Dietary Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={control}
                          name="isVegetarian"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-green-50 transition-colors">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-base cursor-pointer">🥬 Vegetarian</FormLabel>
                                <FormDescription>Contains no meat or fish</FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="isVegan"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-green-50 transition-colors">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-base cursor-pointer">🌱 Vegan</FormLabel>
                                <FormDescription>Contains no animal products</FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="isGlutenFree"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-green-50 transition-colors">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-base cursor-pointer">🌾 Gluten-Free</FormLabel>
                                <FormDescription>Contains no gluten</FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <FormField
                      control={control}
                      name="allergens"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-lg font-semibold">Allergens</FormLabel>
                            <FormDescription>Select all allergens present in this dish</FormDescription>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {allergensList.map(allergen => (
                              <FormField
                                key={allergen}
                                control={control}
                                name="allergens"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={allergen}
                                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-red-50 transition-colors"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(allergen)}
                                          onCheckedChange={checked => {
                                            return checked
                                              ? field.onChange([...field.value, allergen])
                                              : field.onChange(field.value?.filter(value => value !== allergen));
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal cursor-pointer">{allergen}</FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                {/* Product Images */}
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <ImageIcon className="w-5 h-5 text-pink-600" />
                      </div>
                      <span className="text-2xl text-slate-800">Product Images</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-pink-400 transition-colors">
                        {uploadedImage ? (
                          <div className="relative group">
                            <img
                              src={uploadedImage}
                              alt="Product preview"
                              className="w-full h-64 object-cover rounded-lg shadow-md"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                              <Button variant="destructive" size="sm" onClick={() => setUploadedImage(null)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Image
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center space-y-4">
                            <UploadCloud className="w-12 h-12 mx-auto text-pink-400" />
                            <h4 className="text-lg font-medium text-slate-700">Upload Product Image</h4>
                            <p className="text-slate-500 max-w-md">
                              Drag & drop your product image here, or click to browse files
                            </p>
                            <div className="pt-4">
                              <Label htmlFor="product-image" className="cursor-pointer">
                                <Button asChild variant="outline" className="border-pink-300 hover:bg-pink-50">
                                  <div>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Select Image
                                  </div>
                                </Button>
                                <Input
                                  id="product-image"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={e => {
                                    if (e.target.files?.[0]) {
                                      handleImageUpload(e.target.files[0]);
                                    }
                                  }}
                                />
                              </Label>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-lg font-medium text-slate-800 mb-4">Additional Images</h4>
                        {additionalImages.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {additionalImages.map((img, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={img}
                                  alt={`Additional ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg shadow"
                                />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setAdditionalImages(additionalImages.filter((_, i) => i !== index))}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <Label htmlFor="additional-images" className="cursor-pointer">
                              <div className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg hover:border-pink-400 transition-colors">
                                <Plus className="w-6 h-6 text-pink-400" />
                                <span className="text-sm text-slate-600 mt-2">Add More</span>
                              </div>
                              <Input
                                id="additional-images"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                multiple
                                onChange={e => {
                                  if (e.target.files) {
                                    const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
                                    setAdditionalImages([...additionalImages, ...newImages]);
                                  }
                                }}
                              />
                            </Label>
                          </div>
                        ) : (
                          <Label htmlFor="additional-images" className="cursor-pointer">
                            <div className="w-full p-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg hover:border-pink-400 transition-colors">
                              <Upload className="w-10 h-10 text-pink-400" />
                              <h4 className="text-lg font-medium text-slate-700 mt-4">Add Additional Images</h4>
                              <p className="text-slate-500 max-w-md text-center">
                                Show different angles or variations of your product
                              </p>
                            </div>
                            <Input
                              id="additional-images"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              multiple
                              onChange={e => {
                                if (e.target.files) {
                                  const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
                                  setAdditionalImages(newImages);
                                }
                              }}
                            />
                          </Label>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="xl:col-span-1 space-y-8">
                {/* Status Card */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
                    <CardTitle className="text-xl text-slate-800">Product Status</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Active</span>
                    </div>
                    <Alert variant="default" className="border-blue-200 bg-blue-50">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <AlertDescription className="text-blue-700">
                        Your product will be visible to customers immediately after saving.
                      </AlertDescription>
                    </Alert>
                    <div className="pt-2">
                      <Button variant="outline" className="w-full border-slate-300 hover:bg-slate-50">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Availability
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Card */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="text-xl text-slate-800">Save Product</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <Button
                      onClick={handleSubmit(onSubmit)}
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Save Product
                    </Button>
                    <Button variant="outline" size="lg" className="w-full hover:bg-slate-50 transition-colors">
                      <Eye className="w-5 h-5 mr-2" />
                      Preview
                    </Button>
                    <Button variant="ghost" size="lg" className="w-full text-red-600 hover:bg-red-50">
                      <Trash2 className="w-5 h-5 mr-2" />
                      Discard Changes
                    </Button>
                  </CardContent>
                </Card>

                {/* Stats Card */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
                    <CardTitle className="text-xl text-slate-800">Product Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Created</span>
                        <span className="font-medium">Just now</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Last Updated</span>
                        <span className="font-medium">Never</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Views</span>
                        <span className="font-medium">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Orders</span>
                        <span className="font-medium">0</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Popularity</span>
                      <Badge variant="secondary">New</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default RestaurantProductAdd;