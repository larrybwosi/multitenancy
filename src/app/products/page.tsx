"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { CategoryForm } from "@/components/products/category-form";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/categories";
import { ProductForm } from "@/components/products/product-form";
import { useCreateProduct, useProducts } from "@/lib/hooks/products";
import { createProduct, deleteProduct, updateProduct } from "@/actions/products";
import { useCategories } from "@/lib/hooks/use-categories";
import { toast } from "sonner";

type ActiveTab = "products" | "categories";


const ProductsManagement = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("products");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentItem, setCurrentItem] = useState<any>(null);

  const { products, mutateProducts } = useProducts();
  const { categories, mutate: mutateCategories } = useCategories();

  // Common handlers
  const handleOpenEdit = (item: any) => {
    setCurrentItem(item);
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setCurrentItem(null);
  };

  // Category handlers
  const handleAddCategory = async (values: any) => {
    setIsSubmitting(true);
    try {
      const result = await createCategory(values);
      if (result.name) {
        toast.success(`${result.name} added`,{
          description: "The category has been added successfully.",
        });
        handleCloseModals();
        mutateCategories();
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to add category.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async (values: any) => {
    setIsSubmitting(true);
    try {
      const result = await updateCategory(currentItem.id, values);
      if (result.name) {
        toast.success("Category updated",{
          description: "The category has been updated successfully.",
        });
        handleCloseModals();
        mutateCategories();
      }
    } catch (error) {
      toast("Error !", {
        description: "Failed to update category.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        const result = await deleteCategory(id);
        if (result.id) {
          toast({
            title: "Category deleted",
            description: "The category has been deleted successfully.",
          });
          mutateCategories();
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete category.",
          variant: "destructive",
        });
      }
    }
  };

  // Product handlers
  const handleAddProduct = async (values: any) => {
    setIsSubmitting(true);
    console.log(values);
    try {
      if (values.image) {
        const blob = dataURLtoBlob(values.image);
        const formData = new FormData();
        formData.append(
          "file",
          blob,
          `${values.name}-${Date.now().toString()}.jpg`
        );

        const result = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await result.json();
        if (data?.url) {
          values.image_url = data.url;
        }
      }

      const result = await createProduct({
        ...values,
        categoryId: values.category.toString(),
        price: parseInt(values.price),
        stock: parseInt(values.stock),
      });

      if (result.id) {
        toast({
          title: "Product added",
          description: "The product has been added successfully.",
        });
        handleCloseModals();
        mutateProducts();
      }
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to add product.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (values: any) => {
    setIsSubmitting(true);
    try {
      const result = await updateProduct(currentItem.id, {
        ...values,
        categoryId: values.category.toString(),
        price: parseInt(values.price),
        stock: parseInt(values.stock),
      });
      if (result.name) {
        toast({
          title: `${result.name} updated`,
          description: "The product has been updated successfully.",
        });
        handleCloseModals();
        mutateProducts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const result = await deleteProduct(parseInt(id));
        if (result.id) {
          toast({
            title: `${result.name} deleted`,
            description: "The product has been deleted successfully.",
          });
          mutateProducts();
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete product.",
          variant: "destructive",
        });
      }
    }
  };

  // Helper function
  const dataURLtoBlob = (dataURL: string) => {
    const byteString = atob(dataURL.split(",")[1]);
    const mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
  };

  // Filter data based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {activeTab === "products" ? "Product" : "Category"}
          </Button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <Button
              variant="ghost"
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "products"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("products")}
            >
              Products
            </Button>
            <Button
              variant="ghost"
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "categories"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("categories")}
            >
              Categories
            </Button>
          </div>

          {/* Search and filters */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="ml-3">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Products Table */}
          {activeTab === "products" && (
            <TableComponent
              type="products"
              data={filteredProducts}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteProduct}
            />
          )}

          {/* Categories Table */}
          {activeTab === "categories" && (
            <TableComponent
              type="categories"
              data={filteredCategories}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteCategory}
            />
          )}
        </div>
      </div>

      {/* Add/Edit Modals */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent
          className={activeTab === "products" ? "w-[900px] max-w-7xl" : ""}
        >
          <DialogHeader>
            <DialogTitle>
              Add {activeTab === "products" ? "Product" : "Category"}
            </DialogTitle>
          </DialogHeader>
          {activeTab === "products" ? (
            <ProductForm
              onSubmit={handleAddProduct}
              isSubmitting={isSubmitting}
              categories={categories}
            />
          ) : (
            <CategoryForm
              onSubmit={handleAddCategory}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className={activeTab === "products" ? "w-[900px] max-w-7xl" : ""}
        >
          <DialogHeader>
            <DialogTitle>
              Edit {activeTab === "products" ? "Product" : "Category"}
            </DialogTitle>
          </DialogHeader>
          {activeTab === "products" ? (
            <ProductForm
              onSubmit={handleEditProduct}
              isSubmitting={isSubmitting}
              categories={categories}
              defaultValues={currentItem}
            />
          ) : (
            <CategoryForm
              onSubmit={handleEditCategory}
              isSubmitting={isSubmitting}
              defaultValues={currentItem}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Table component to reduce duplication
const TableComponent = ({
  type,
  data,
  onEdit,
  onDelete,
}: {
  type: ActiveTab;
  data: any[];
  onEdit: (item: any) => void;
  onDelete: (id: any) => void;
}) => {
  if (type === "products") {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price (KSH)</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((product) => (
                <TableRow key={product.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center">
                      {product.image && (
                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={50}
                              height={50}
                            />
                          ) : (
                            <div className="bg-gray-200 w-10 h-10"></div>
                          )}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.description?.substring(0, 50)}
                          {product?.description?.length > 50 ? "..." : ""}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.sku || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
                    >
                      {product.category.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div
                      className={`text-sm ${
                        product.lowStockThreshold &&
                        product.stock <= product.lowStockThreshold
                          ? "text-red-500 font-medium"
                          : "text-gray-900"
                      }`}
                    >
                      {product.stock}
                    </div>
                    {product.lowStockThreshold &&
                      product.stock <= product.lowStockThreshold && (
                        <div className="text-xs text-red-500">Low stock</div>
                      )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={() => onEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-sm text-gray-500"
                >
                  No products found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Products Count</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((category) => (
              <TableRow key={category.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.description || "-"}</TableCell>
                <TableCell>{category.product_count || 0}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    onClick={() => onEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-900"
                    onClick={() => onDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-sm text-gray-500"
              >
                No categories found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductsManagement;
