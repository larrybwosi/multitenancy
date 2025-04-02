// app/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, MoreHorizontal, Search, RefreshCw } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import CategoriesTab from "./components/categories";
import ProductsTab from "./components/products";

// Types based on your Prisma models
type Category = {
  id: number;
  orgId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

type Product = {
  id: number;
  orgId: string;
  name: string;
  sku?: string;
  barcode?: string;
  stock: number;
  updatedAt: Date;
  createdAt: Date;
  description?: string;
  image_url?: string;
  price: number;
  purchase_price?: number;
  profit_margin?: number;
  min_stock_level?: number;
  category_id: number;
  unit?: string;
  unit_quantity?: number;
  unit_price?: number;
  selling_unit?: string;
  selling_unit_quantity?: number;
  taxRate?: number;
  isActive: boolean;
  isService: boolean;
  category: Category;
};

// Zod schemas for validation
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  stock: z.number().int().nonnegative().default(0),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  price: z.number().positive("Price must be greater than 0"),
  purchase_price: z.number().positive().optional(),
  profit_margin: z.number().optional(),
  min_stock_level: z.number().int().nonnegative().optional(),
  category_id: z.number().int().positive("Category is required"),
  unit: z.string().optional(),
  unit_quantity: z.number().positive().optional(),
  unit_price: z.number().positive().optional(),
  selling_unit: z.string().optional(),
  selling_unit_quantity: z.number().positive().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  isActive: z.boolean().default(true),
  isService: z.boolean().default(false),
});

type CategoryFormValues = z.infer<typeof categorySchema>;
type ProductFormValues = z.infer<typeof productSchema>;

// Mock data
const mockCategories: Category[] = [
  {
    id: 1,
    orgId: "org-123",
    name: "Electronics",
    description: "Electronic devices and accessories",
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: 2,
    orgId: "org-123",
    name: "Clothing",
    description: "Apparel and fashion items",
    createdAt: new Date("2023-01-02"),
    updatedAt: new Date("2023-01-02"),
  },
];

const mockProducts: Product[] = [
  {
    id: 1,
    orgId: "org-123",
    name: "Laptop",
    sku: "LAP-001",
    barcode: "1234567890",
    stock: 10,
    updatedAt: new Date("2023-01-01"),
    createdAt: new Date("2023-01-01"),
    description: "High performance laptop",
    image_url: "https://example.com/laptop.jpg",
    price: 999.99,
    purchase_price: 800,
    profit_margin: 20,
    min_stock_level: 3,
    category_id: 1,
    unit: "piece",
    unit_quantity: 1,
    unit_price: 999.99,
    selling_unit: "piece",
    selling_unit_quantity: 1,
    taxRate: 10,
    isActive: true,
    isService: false,
    category: mockCategories[0],
  },
  {
    id: 2,
    orgId: "org-123",
    name: "T-Shirt",
    sku: "TSH-001",
    barcode: "0987654321",
    stock: 50,
    updatedAt: new Date("2023-01-02"),
    createdAt: new Date("2023-01-02"),
    description: "Cotton t-shirt",
    image_url: "https://example.com/tshirt.jpg",
    price: 19.99,
    purchase_price: 10,
    profit_margin: 50,
    min_stock_level: 10,
    category_id: 2,
    unit: "piece",
    unit_quantity: 1,
    unit_price: 19.99,
    selling_unit: "piece",
    selling_unit_quantity: 1,
    taxRate: 5,
    isActive: true,
    isService: false,
    category: mockCategories[1],
  },
];

export default function ProductManagementPage() {
  // State
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Forms
  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      stock: 0,
      description: "",
      image_url: "",
      price: 0,
      purchase_price: 0,
      profit_margin: 0,
      min_stock_level: 5,
      category_id: 0,
      unit: "piece",
      unit_quantity: 1,
      unit_price: 0,
      selling_unit: "piece",
      selling_unit_quantity: 1,
      taxRate: 0,
      isActive: true,
      isService: false,
    },
  });

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Effects
  useEffect(() => {
    if (currentProduct) {
      productForm.reset({
        name: currentProduct.name,
        sku: currentProduct.sku || "",
        barcode: currentProduct.barcode || "",
        stock: currentProduct.stock,
        description: currentProduct.description || "",
        image_url: currentProduct.image_url || "",
        price: currentProduct.price,
        purchase_price: currentProduct.purchase_price || 0,
        profit_margin: currentProduct.profit_margin || 0,
        min_stock_level: currentProduct.min_stock_level || 5,
        category_id: currentProduct.category_id,
        unit: currentProduct.unit || "piece",
        unit_quantity: currentProduct.unit_quantity || 1,
        unit_price: currentProduct.unit_price || 0,
        selling_unit: currentProduct.selling_unit || "piece",
        selling_unit_quantity: currentProduct.selling_unit_quantity || 1,
        taxRate: currentProduct.taxRate || 0,
        isActive: currentProduct.isActive,
        isService: currentProduct.isService,
      });
    }
    
    if (currentCategory) {
      categoryForm.reset({
        name: currentCategory.name,
        description: currentCategory.description || "",
      });
    }
  }, [currentProduct]);

  // Handlers
  const handleAddProduct = (data: ProductFormValues) => {
    const newProduct: Product = {
      id: products.length + 1,
      orgId: "org-123",
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: categories.find((c) => c.id === data.category_id)!,
    };
    setProducts([...products, newProduct]);
    toast.success("Product added successfully");
    setIsAddProductOpen(false);
    productForm.reset();
  };

  const handleEditProduct = (data: ProductFormValues) => {
    if (!currentProduct) return;
    const updatedProducts = products.map((p) =>
      p.id === currentProduct.id
        ? {
            ...p,
            ...data,
            updatedAt: new Date(),
            category: categories.find((c) => c.id === data.category_id)!,
          }
        : p
    );
    setProducts(updatedProducts);
    toast.success("Product updated successfully");
    setIsEditProductOpen(false);
    setCurrentProduct(null);
  };

  const handleAddCategory = (data: CategoryFormValues) => {
    const newCategory: Category = {
      id: categories.length + 1,
      orgId: "org-123",
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCategories([...categories, newCategory]);
    toast.success("Category added successfully");
    setIsAddCategoryOpen(false);
    categoryForm.reset();
  };

  const handleEditCategory = (data: CategoryFormValues) => {
    if (!currentCategory) return;
    const updatedCategories = categories.map((c) =>
      c.id === currentCategory.id
        ? {
            ...c,
            ...data,
            updatedAt: new Date(),
          }
        : c
    );
    setCategories(updatedCategories);
    toast.success("Category updated successfully");
    setIsEditCategoryOpen(false);
    setCurrentCategory(null);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Inventory Management
      </h1>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search products or categories..."
            className="pl-10 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setSearchTerm("");
          }}
        >
          <RefreshCw size={18} />
        </Button>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <ProductsTab/>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <CategoriesTab/>
        </TabsContent>
      </Tabs>

      {/* Edit Product Dialog */}
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details
            </DialogDescription>
          </DialogHeader>
          <Form {...productForm}>
            <form
              onSubmit={productForm.handleSubmit(handleEditProduct)}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
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

              {/* Rest of the product form fields (same as Add Product) */}
              {/* ... */}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditProductOpen(false);
                    setCurrentProduct(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category details
            </DialogDescription>
          </DialogHeader>
          <Form {...categoryForm}>
            <form
              onSubmit={categoryForm.handleSubmit(handleEditCategory)}
              className="space-y-6"
            >
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter category description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditCategoryOpen(false);
                    setCurrentCategory(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}