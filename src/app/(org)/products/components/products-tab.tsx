"use client";

import { useState } from "react";
import { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
} from "lucide-react";
import AddProductDialog from "./add-product-dialog";
import { ProductDataTable } from "./product-data-table";
import EditProductDialog from "./edit-product-dialog";
import { productColumns, ProductWithRelations } from "./products-columns";
import { toast } from "sonner";
import { RestockDialog } from "./restock";

interface ProductsTabProps {
  initialProducts: ProductWithRelations[];
  initialCategories: Category[];
}

export default function ProductsTab({
  initialProducts,
  initialCategories,
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



  return (
    <div className="px-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2" />
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsAddProductOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <ProductDataTable
        columns={dynamicProductColumns}
        data={initialProducts}
      />

      {/* Dialogs */}
      <AddProductDialog
        isOpen={isAddProductOpen}
        setIsOpen={setIsAddProductOpen}
        categories={initialCategories}
        onSuccess={(message) =>
          toast.success("Product Added", {
            description: message,
            action: {
              label: "View All",
              onClick: () => {},
            },
          })
        }
        onError={(message) =>
          toast.error("Action Failed", {
            description: message,
            action: {
              label: "Retry",
              onClick: () => setIsAddProductOpen(true),
            },
          })
        }
      />

      {selectedProductForRestock && (
        <RestockDialog
          productId={selectedProductForRestock?.id}
          open={isRestockOpen}
          onOpenChange={setIsRestockOpen}
          onSuccess={() => {
            // Refresh your product data here
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
