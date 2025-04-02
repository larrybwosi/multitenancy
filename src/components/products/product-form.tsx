"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Category } from "@prisma/client";
import Image from "next/image";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.string().min(1, "Price is required"),
  category: z.string().min(1, "Category is required"),
  stock: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
});

export const ProductForm = ({
  onSubmit,
  defaultValues,
  isSubmitting,
  categories,
}: {
  onSubmit: (values: z.infer<typeof productSchema>) => void;
  defaultValues?: any;
  isSubmitting: boolean;
  categories: Category[];
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(
    defaultValues?.image || null
  );

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });
  
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

  return (
    <Card className="w-[800px] max-w-6xl  shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="w-1 h-8 bg-blue-500 rounded-full mr-3"></div>
          <h2 className="text-2xl font-semibold text-gray-800">
            {defaultValues ? "Edit Product" : "Add New Product"}
          </h2>
        </div>

        <Separator className="mb-6" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Unit Price *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <p className="absolute left-3 top-2.5 h-5 w-4 mr-2 text-sm text-gray-400">
                            KSH{" "}
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
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Stock Quantity
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Package className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input
                            type="number"
                            placeholder="e.g. 50"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Leave empty for unlimited stock
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Product Image
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div
                            className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden"
                            onClick={() =>
                              document.getElementById("image-upload")?.click()
                            }
                          >
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageChange}
                            />

                            {previewImage ? (
                              <div className="relative aspect-video w-full">
                                <Image
                                  src={previewImage}
                                  alt="Product preview"
                                  fill
                                  className="object-cover h-50"
                                />
                                <p className="text-sm mt-2 text-gray-600">
                                  Click to change image
                                </p>
                              </div>
                            ) : (
                              <div className="py-4">
                                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-2 flex text-sm text-gray-600 justify-center">
                                  <Upload className="mr-1 h-5 w-5" />
                                  <span>Upload a product image</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  PNG, JPG, GIF up to 5MB
                                </p>
                              </div>
                            )}
                          </div>
                          <input {...field} type="hidden" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                    Include key features, specifications, and other details that
                    will help customers make a purchase decision
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" className="mr-2">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {defaultValues ? "Saving..." : "Creating..."}
                  </>
                ) : defaultValues ? (
                  "Save Changes"
                ) : (
                  "Add Product"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
