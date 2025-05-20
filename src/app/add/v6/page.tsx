
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ChefHat, UploadCloud, DollarSign, Save, Calendar, Star, Clock, Trash2, Eye, CheckCircle, AlertCircle, ImageIcon, Package, Info, Plus,
  Upload
} from 'lucide-react';
import { Alert, AlertDescription, Badge, Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, Textarea } from '@/components/ui';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


  // Zod schema for form validation
  const productSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').nonempty('Product name is required'),
    description: z.string().optional(),
    category: z.string().nonempty('Category is required'),
    subCategory: z.string().optional(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format').nonempty('Price is required'),
    discountPrice: z.string().optional(),
    discount: z.string().optional(),
    minimumOrder: z.number().min(1, 'Minimum order must be at least 1'),
    stock: z.string().optional(),
    sku: z.string().optional(),
    preparationTime: z.string().nonempty('Preparation time is required'),
    spiceLevel: z.string(),
    isVegetarian: z.boolean(),
    isVegan: z.boolean(),
    isGlutenFree: z.boolean(),
    calories: z.string().optional(),
    allergens: z.array(z.string()),
    variants: z.array(
      z.object({
        name: z.string().nonempty('Variant name is required'),
        price: z.string().nonempty('Variant price is required'),
        description: z.string().optional(),
      })
    ).min(1, 'At least one variant is required'),
  });

const RestaurantProductAdd = () => {
    const [uploadedImage, setUploadedImage] = useState(null);
    const [additionalImages, setAdditionalImages] = useState([]);
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [editingVariantIndex, setEditingVariantIndex] = useState(null);

    const form = useForm({
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

    const { handleSubmit, control, watch, setValue, getValues, formState: { errors } } = form;
    const watchedVariants = watch('variants');
    const selectedCategory = watch('category');

    const onSubmit = (data) => {
      console.log('Form submitted:', data);
    };

    const openVariantModal = (index = null) => {
      setEditingVariantIndex(index);
      setIsVariantModalOpen(true);
    };

    const closeVariantModal = () => {
      setIsVariantModalOpen(false);
      setEditingVariantIndex(null);
    };

    const saveVariant = (data) => {
      const currentVariants = getValues('variants');
      if (editingVariantIndex !== null) {
        currentVariants[editingVariantIndex] = data;
      } else {
        currentVariants.push(data);
      }
      setValue('variants', [...currentVariants]);
      closeVariantModal();
    };

    const removeVariant = (index) => {
      const currentVariants = getValues('variants');
      if (currentVariants.length > 1) {
        setValue('variants', currentVariants.filter((_, i) => i !== index));
      }
    };

    const handleImageUpload = (file) => {
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

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="mb-8 border-none shadow-2xl bg-white/95">
            <CardHeader className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-600 rounded-xl">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">Add New Menu Item</h1>
                    <p className="text-gray-600">Craft a delightful dish to entice your customers</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">Preview <Eye className="w-4 h-4 ml-2" /></Button>
                  <Button onClick={handleSubmit(onSubmit)}>Save <Save className="w-4 h-4 ml-2" /></Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gray-50">
                      <CardTitle className="flex items-center space-x-2">
                        <Info className="w-5 h-5 text-blue-600" />
                        <span>Basic Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <FormField
                        control={control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Classic Margherita Pizza" {...field} />
                            </FormControl>
                            <FormDescription>Enter a catchy name for your dish</FormDescription>
                            <FormMessage>{errors.name?.message}</FormMessage>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe the flavors, ingredients, and uniqueness of your dish..." {...field} />
                            </FormControl>
                            <FormDescription>Highlight what makes this dish special</FormDescription>
                            <FormMessage>{errors.description?.message}</FormMessage>
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage>{errors.category?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="subCategory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sub-Category</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={!selectedCategory || !subcategories[selectedCategory]}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Sub-Category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {selectedCategory && subcategories[selectedCategory]?.map(sub => (
                                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage>{errors.subCategory?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pricing */}
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gray-50">
                      <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span>Pricing</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Base Price ($)*</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input type="number" step="0.01" placeholder="0.00" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage>{errors.price?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="discountPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discount Price ($)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input type="number" step="0.01" placeholder="0.00" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage>{errors.discountPrice?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="discount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discount (%)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0" max="100" {...field} />
                              </FormControl>
                              <FormMessage>{errors.discount?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="minimumOrder"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum Order Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage>{errors.minimumOrder?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Variants */}
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gray-50">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Star className="w-5 h-5 text-purple-600" />
                          <span>Product Variants</span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => openVariantModal()}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Variant
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {watchedVariants.map((variant, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{variant.name}</p>
                              <p className="text-sm text-gray-500">${variant.price}</p>
                              <p className="text-sm text-gray-500">{variant.description}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                type="button"
                                onClick={() => openVariantModal(index)}
                                variant="outline"
                                size="sm"
                              >
                                Edit
                              </Button>
                              {watchedVariants.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => removeVariant(index)}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Variant Modal */}
                  <Dialog open={isVariantModalOpen} onOpenChange={closeVariantModal}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingVariantIndex !== null ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <FormField
                          control={control}
                          name={`variants.${editingVariantIndex !== null ? editingVariantIndex : watchedVariants.length}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Variant Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Small, Large" {...field} />
                              </FormControl>
                              <FormMessage>{errors.variants?.[editingVariantIndex !== null ? editingVariantIndex : watchedVariants.length]?.name?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`variants.${editingVariantIndex !== null ? editingVariantIndex : watchedVariants.length}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price *</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                              </FormControl>
                              <FormMessage>{errors.variants?.[editingVariantIndex !== null ? editingVariantIndex : watchedVariants.length]?.price?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`variants.${editingVariantIndex !== null ? editingVariantIndex : watchedVariants.length}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input placeholder="Brief description of the variant" {...field} />
                              </FormControl>
                              <FormMessage>{errors.variants?.[editingVariantIndex !== null ? editingVariantIndex : watchedVariants.length]?.description?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={closeVariantModal}>Cancel</Button>
                        <Button
                          onClick={() => {
                            const variantData = {
                              name: getValues(`variants.${editingVariantIndex !== null ? editingVariantIndex : watchedVariants.length}.name`),
                              price: getValues(`variants.${editingVariantIndex !== null ? editingVariantIndex : watchedVariants.length}.price`),
                              description: getValues(`variants.${editingVariantIndex !== null ? editingVariantIndex : watchedVariants.length}.description`),
                            };
                            saveVariant(variantData);
                          }}
                        >
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Product Details */}
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gray-50">
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <span>Product Details</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={control}
                          name="preparationTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preparation Time (min) *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input type="number" placeholder="15" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage>{errors.preparationTime?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="calories"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Calories</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="250" {...field} />
                              </FormControl>
                              <FormMessage>{errors.calories?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="stock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stock Quantity</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input type="number" placeholder="100" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage>{errors.stock?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="spiceLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Spice Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
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
                              <FormMessage>{errors.spiceLevel?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="sku"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <FormControl>
                                <Input placeholder="PROD-001" {...field} />
                              </FormControl>
                              <FormMessage>{errors.sku?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                      </div>
                      <Separator />
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Dietary Information</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={control}
                            name="isVegetarian"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 border p-3 rounded-md">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel className="cursor-pointer">🥬 Vegetarian</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name="isVegan"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 border p-3 rounded-md">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel className="cursor-pointer">🌱 Vegan</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name="isGlutenFree"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 border p-3 rounded-md">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel className="cursor-pointer">🌾 Gluten-Free</FormLabel>
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
                            <FormLabel className="text-lg font-semibold">Allergens</FormLabel>
                            <FormDescription>Select any allergens present in this dish</FormDescription>
                            <div className="grid grid-cols-4 gap-2">
                              {allergensList.map(allergen => (
                                <FormField
                                  key={allergen}
                                  control={control}
                                  name="allergens"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 border p-2 rounded-md">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(allergen)}
                                          onCheckedChange={checked =>
                                            checked
                                              ? field.onChange([...field.value, allergen])
                                              : field.onChange(field.value?.filter(value => value !== allergen))
                                          }
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm cursor-pointer">{allergen}</FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            <FormMessage>{errors.allergens?.message}</FormMessage>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Product Images */}
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gray-50">
                      <CardTitle className="flex items-center space-x-2">
                        <ImageIcon className="w-5 h-5 text-pink-600" />
                        <span>Product Images</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        {uploadedImage ? (
                          <div className="relative group">
                            <img src={uploadedImage} alt="Product" className="w-full h-64 object-cover rounded-lg" />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                              onClick={() => setUploadedImage(null)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <UploadCloud className="w-12 h-12 mx-auto text-pink-400" />
                            <p className="text-gray-600">Upload a high-quality image of your dish</p>
                            <Label>
                              <Button variant="outline">
                                <Upload className="w-4 h-4 mr-2" />
                                Select Image
                              </Button>
                              <Input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                              />
                            </Label>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Additional Images</h4>
                        <div className="grid grid-cols-4 gap-4">
                          {additionalImages.map((img, index) => (
                            <div key={index} className="relative group">
                              <img src={img} alt={`Additional ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                                onClick={() => setAdditionalImages(additionalImages.filter((_, i) => i !== index))}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Label>
                            <div className="w-full h-32 flex items-center justify-center border-2 border-dashed rounded-lg">
                              <Plus className="w-6 h-6 text-pink-400" />
                            </div>
                            <Input
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
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gray-50">
                      <CardTitle>Product Status</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center space-x-2 bg-green-50 p-3 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Active</span>
                      </div>
                      <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>Visible to customers upon saving</AlertDescription>
                      </Alert>
                      <Button variant="outline" className="w-full">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gray-50">
                      <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <Button onClick={handleSubmit(onSubmit)} className="w-full">Save <Save className="w-4 h-4 ml-2" /></Button>
                      <Button variant="outline" className="w-full">Preview <Eye className="w-4 h-4 ml-2" /></Button>
                      <Button variant="ghost" className="w-full text-red-600">Discard <Trash2 className="w-4 h-4 ml-2" /></Button>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gray-50">
                      <CardTitle>Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created</span>
                          <span>Just now</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Updated</span>
                          <span>Never</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Views</span>
                          <span>0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Orders</span>
                          <span>0</span>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-semibold">Popularity</span>
                        <Badge>New</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    );
  };
  export default RestaurantProductAdd