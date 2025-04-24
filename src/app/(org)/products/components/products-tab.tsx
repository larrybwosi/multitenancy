"use client";

import { useState } from "react";
import { Category, Product, ProductVariant } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Download, FileText, PlusCircle, Printer } from "lucide-react";
import EditProductDialog from "./edit-product-dialog";
import { toast } from "sonner";
import { RestockDialog } from "./restock";
import { ProductTable } from "./products-table";

type ProductWithRelations = Product & {
  category: Category | null;
  variants?: ProductVariant[];
  _count?: { stockBatches?: number };
  totalStock: number;
};

interface ProductsTabProps {
  initialProducts: ProductWithRelations[];
  initialCategories: Category[];
}

export default function ProductsTab({
  initialProducts,
  initialCategories,
}: ProductsTabProps) {
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] =
    useState<ProductWithRelations | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] =
    useState<ProductWithRelations | null>(null);

  const handleRestockClick = (product: ProductWithRelations) => {
    setSelectedProductForRestock(product);
    setIsRestockOpen(true);
  };

  const handleEditClick = (product: ProductWithRelations) => {
    setSelectedProductForEdit(product);
    setIsEditProductOpen(true);
  };

  const filterOptions = {
    searchPlaceholder: "Search products...",
    showSearch: true,
    onSearch: (value: string) => console.log("Searching:", value),

    showFilterButton: true,
    onFilterButtonClick: () => console.log("Advanced filters clicked"),

    filters: [
      {
        name: "status",
        label: "Status",
        options: [
          { value: "all", label: "All Statuses" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
        defaultValue: "all",
        onChange: (value: string) => console.log("Status filter:", value),
      },
      {
        name: "category",
        label: "Category",
        options: [
          { value: "all", label: "All Categories" },
          ...initialCategories.map((cat) => ({
            value: cat.id,
            label: cat.name,
          })),
        ],
        defaultValue: "all",
        onChange: (value: string) => console.log("Category filter:", value),
      },
      {
        name: "stockStatus",
        label: "Stock Status",
        options: [
          { value: "all", label: "All" },
          { value: "inStock", label: "In Stock" },
          { value: "lowStock", label: "Low Stock" },
          { value: "outOfStock", label: "Out of Stock" },
        ],
        defaultValue: "all",
        onChange: (value: string) => console.log("Stock status filter:", value),
      },
      {
        name: "priceRange",
        label: "Price Range",
        options: [
          { value: "all", label: "All Prices" },
          { value: "0-50", label: "Under $50" },
          { value: "50-100", label: "$50 - $100" },
          { value: "100-500", label: "$100 - $500" },
          { value: "500+", label: "Over $500" },
        ],
        defaultValue: "all",
        onChange: (value: string) => console.log("Price range filter:", value),
      },
    ],

    exportActions: [
      {
        label: "Export as CSV",
        icon: <Download className="w-4 h-4 mr-2" />,
        onClick: () => toast.info("Preparing CSV export..."),
      },
      {
        label: "Export as PDF",
        icon: <FileText className="w-4 h-4 mr-2" />,
        onClick: () => toast.info("Generating PDF report..."),
      },
      {
        label: "Print List",
        icon: <Printer className="w-4 h-4 mr-2" />,
        onClick: () => {
          toast.info("Preparing print layout...");
          setTimeout(() => window.print(), 1000);
        },
      },
    ],
  };

  const paginationProps = {
    currentPage: 1,
    totalPages: 5,
    pageSize: 10,
    totalItems: 50,
    onPageChange: (page: number) => console.log("Page changed to:", page),
    onPageSizeChange: (size: number) =>
      console.log("Page size changed to:", size),
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Product Inventory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your products and inventory
          </p>
        </div>

        <Button
          asChild
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 
                     text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <a href="/products/add" className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
            Add Product
          </a>
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ProductTable
          products={initialProducts}
          onDelete={() => {}}
          onRestock={handleRestockClick}
          onEdit={handleEditClick}
          filterControlsProps={filterOptions}
          paginationProps={paginationProps}
        />
      </div>

      {selectedProductForRestock && (
        <RestockDialog
          productId={selectedProductForRestock.id}
          open={isRestockOpen}
          onOpenChange={setIsRestockOpen}
          onSuccess={() => {
            toast.success("Restock successful", {
              description: `${selectedProductForRestock.name} has been restocked`,
            });
          }}
        />
      )}

      {selectedProductForEdit && (
        <EditProductDialog
          isOpen={isEditProductOpen}
          setIsOpen={setIsEditProductOpen}
          product={selectedProductForEdit}
          categories={initialCategories}
          onSuccess={(message) =>
            toast.success("Product Updated", {
              description: message,
              action: {
                label: "View Changes",
                onClick: () => {},
              },
            })
          }
          onError={(message) =>
            toast.error("Update Failed", {
              description: message,
              action: {
                label: "Retry",
                onClick: () => setIsEditProductOpen(true),
              },
            })
          }
          onClose={() => setSelectedProductForEdit(null)}
        />
      )}
    </div>
  );
}
