"use client"; // Needs state for dialogs, table interactions

import React, { useState } from "react";
import { Product, Category, StockBatch, ProductVariant } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import AddProductDialog from "./add-product-dialog";
import { ProductDataTable } from "./product-data-table";
import RestockDialog from "./restock-dialog";
import EditProductDialog from "./edit-product-dialog"; 
import { Separator } from "@/components/ui/separator";
import { productColumns } from "./products-columns";
import { batchColumns } from "./batch-column";
import { toast } from "sonner";

// Define the expected types including relations fetched in the server action
type ProductWithRelations = Product & {
  category: Category;
  variants: ProductVariant[];
  _count: { stockBatches: number };
  totalStock: number; // Added from server calculation
};

type StockBatchWithRelations = StockBatch & {
  product: Product;
  variant: ProductVariant | null;
  purchaseItem: any; // Adjust type as needed
};

interface ProductsTabProps {
  initialProducts: ProductWithRelations[];
  initialCategories: Category[];
  initialActiveBatches: StockBatchWithRelations[];
}

export default function ProductsTab({
  initialProducts,
  initialCategories,
  initialActiveBatches,
}: ProductsTabProps) {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
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

  // Create dynamic columns that include the edit/restock actions
  const dynamicProductColumns = productColumns({
    onEdit: handleEditClick,
    onRestock: handleRestockClick,
  });
  // Pass any needed actions to batch columns too
  const dynamicBatchColumns = batchColumns({});

  return (
    <div className="space-y-6">
      {/* --- Products Section --- */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Products</h3>
          <Button onClick={() => setIsAddProductOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
        <ProductDataTable
          columns={dynamicProductColumns}
          data={initialProducts}
          // Pass filter functions or search state if needed
        />
      </div>

      <Separator />

      {/* --- Active Batches Section --- */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Current Stock Batches</h3>
        {/* Optional: Add filtering/search for batches */}
        {/* <BatchDataTable
          columns={dynamicBatchColumns}
          data={initialActiveBatches}
        /> */}
      </div>

      {/* --- Dialogs --- */}
      <AddProductDialog
        isOpen={isAddProductOpen}
        setIsOpen={setIsAddProductOpen}
        categories={initialCategories}
        onSuccess={(message) =>
          toast.success("Success", { description: message })
        }
        onError={(message) => toast.error("Error", { description: message })}
      />

      {selectedProductForRestock && (
        <RestockDialog
          isOpen={isRestockOpen}
          setIsOpen={setIsRestockOpen}
          product={selectedProductForRestock}
          // Pass variants if applicable: product.variants
          onSuccess={(message) =>
            toast.success("Success", { description: message })
          }
          onError={(message) => toast.error("Error", { description: message })}
          onClose={() => setSelectedProductForRestock(null)}
        />
      )}

      {selectedProductForEdit && (
        <EditProductDialog
          isOpen={isEditProductOpen}
          setIsOpen={setIsEditProductOpen}
          product={selectedProductForEdit}
          categories={initialCategories}
          onSuccess={(message) => toast.success("Success", { description: message })}
          onError={(message) => toast.error("Error", { description: message })}
          onClose={() => setSelectedProductForEdit(null)}
        />
      )}
    </div>
  );
}
