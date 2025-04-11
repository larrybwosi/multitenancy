"use client";

import { useState } from "react";
import { Product, Category, StockBatch, ProductVariant } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  PackageSearch,
  Boxes,
  TrendingUp,
  DollarSign,
  BarChart3,
} from "lucide-react";
import AddProductDialog from "./add-product-dialog";
import { ProductDataTable } from "./product-data-table";
import RestockDialog from "./restock-dialog";
import EditProductDialog from "./edit-product-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productColumns, ProductWithRelations } from "./products-columns";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


type StockBatchWithRelations = StockBatch & {
  product: Product;
  variant: ProductVariant | null;
  purchaseItem: any;
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

  // Calculate some summary stats
  const totalProducts = initialProducts.length;
  const activeBatchesCount = initialActiveBatches.length;
  const lowStockProducts = initialProducts.filter(
    (p) => p.totalStock < 10
  ).length;
  const totalStockValue = initialActiveBatches.reduce((sum, batch) => {
    const price =
      typeof batch.purchasePrice === "number"
        ? batch.purchasePrice
        : parseFloat(batch.purchasePrice?.toString() || "0");
    return sum + price * batch.currentQuantity;
  }, 0);

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
    <div className="px-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"/>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 px-2 py-1"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{lowStockProducts} Low Stock</span>
          </Badge>
          <Button
            onClick={() => setIsAddProductOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Total Products
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <PackageSearch className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {totalProducts}
            </div>
            <p className="text-xs text-blue-600 mt-1 flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">
              Active Batches
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center">
              <Boxes className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">
              {activeBatchesCount}
            </div>
            <p className="text-xs text-emerald-600 mt-1 flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>
              Currently in inventory
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              Inventory Value
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(totalStockValue)}
            </div>
            <p className="text-xs text-purple-600 mt-1 flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1"></span>
              Based on purchase price
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">
              Low Stock Items
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {lowStockProducts}
            </div>
            <p className="text-xs text-amber-600 mt-1 flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1"></span>
              Products requiring restock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger
            value="products"
            className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-lg"
          >
            <PackageSearch className="mr-2 h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger
            value="batches"
            className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-lg"
          >
            <Boxes className="mr-2 h-4 w-4" />
            Batches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 rounded-t-lg border-b border-slate-100">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">
                    Product Catalog
                  </CardTitle>
                  <CardDescription className="text-slate-500 mt-1">
                    View and manage your product inventory
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddProductOpen(true)}
                  variant="outline"
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> New Product
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4">
                <ProductDataTable
                  columns={dynamicProductColumns}
                  data={initialProducts}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 rounded-t-lg border-b border-slate-100">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">
                    Stock Batches
                  </CardTitle>
                  <CardDescription className="text-slate-500 mt-1">
                    Current inventory batches with detailed information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4">
                {/* <BatchDataTable
                  columns={dynamicBatchColumns}
                  data={initialActiveBatches}
                /> */}
                <div className="flex items-center justify-center h-40 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                  <div className="text-center text-slate-500">
                    <Boxes className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-medium">
                      Batch data will appear here
                    </p>
                    <p className="text-xs">
                      Uncomment the BatchDataTable component to display data
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
          isOpen={isRestockOpen}
          setIsOpen={setIsRestockOpen}
          product={selectedProductForRestock}
          onSuccess={(message) =>
            toast.success("Restock Complete", {
              description: message,
              action: {
                label: "View Stock",
                onClick: () => {},
              },
            })
          }
          onError={(message) =>
            toast.error("Restock Failed", {
              description: message,
              action: {
                label: "Retry",
                onClick: () => setIsRestockOpen(true),
              },
            })
          }
          onClose={() => setSelectedProductForRestock(null)}
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
