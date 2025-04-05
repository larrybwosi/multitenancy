"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProductTable } from "./product-table";
import { getColumns, ProductColumn } from "./columns";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductForm } from "./product-form";
import { toast } from "sonner"; 
import {
  deleteProduct,
  toggleProductActiveStatus,
  getProductDetails,
  ProductDetails,
} from "@/actions/products"; // Import actions
import { Decimal } from "@prisma/client/runtime/library";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { useSession } from "@/lib/auth/authClient";

interface ProductClientProps {
  initialProducts: ProductColumn[]; // Use the transformed data
  totalCount: number;
  organizationSlug: string; // Needed for routing/context if not in actions
  organizationId: string; // Pass the actual ID to actions
  categories: { id: string; name: string }[];
  // Add props for initial pagination state if needed
}

export function ProductClient({
  initialProducts,
  totalCount,
  categories,
}: ProductClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState(initialProducts); 

  const { data: session } = useSession();

  const organizationId = session?.session.activeOrganizationId;
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductColumn | null>(
    null
  ); // Use ProductColumn for consistency

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductColumn | null>(
    null
  );

  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [detailedProduct, setDetailedProduct] = useState<ProductDetails | null>(
    null
  );
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // Refresh data function (could also use router.refresh for simpler cases)
  const refreshData = () => {
    // For simplicity here, we use router.refresh().
    // In a more complex app, you might re-call `listProducts`
    // and update the local `products` state directly.
    startTransition(() => {
      router.refresh(); // Reloads server component data
    });
    // Close any open modals/sheets after action
    setIsSheetOpen(false);
    setIsDeleteDialogOpen(false);
    setIsDetailsSheetOpen(false);
    setEditingProduct(null);
    setProductToDelete(null);
    setDetailedProduct(null);
  };

  // Effect to update local state if initialProducts prop changes (e.g., after router.refresh)
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handleAddNew = () => {
    setEditingProduct(null); // Clear editing state
    setIsSheetOpen(true);
  };

  const handleEdit = (product: ProductColumn) => {
    setEditingProduct(product);
    setIsSheetOpen(true);
  };

  const handleDeleteConfirm = (product: ProductColumn) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!productToDelete) return;
    startTransition(async () => {
      try {
        const response = await deleteProduct(
          organizationId,
          productToDelete.id,
        );
        if (response.success) {
          toast.success(`Product "${productToDelete.name}" deleted.`);
          refreshData(); // Refresh the list
        } else {
          toast.error(
            `Error: ${response.error || "Failed to delete product."}`
          );
        }
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("An unexpected error occurred during deletion.");
      } finally {
        setIsDeleteDialogOpen(false); // Close dialog regardless of outcome
        setProductToDelete(null);
      }
    });
  };

  const handleToggleStatus = (product: ProductColumn) => {
    startTransition(async () => {
      try {
        const newStatus = !product.isActive;
        const response = await toggleProductActiveStatus(
          organizationId,
          product.id,
          newStatus
        );
        if (response.success && response.data) {
          toast.success(
            `Product "${product.name}" status set to ${newStatus ? "Active" : "Inactive"}.`
          );
          refreshData(); // Refresh the list
        } else {
          toast.error(`Error: ${response.error || "Failed to update status."}`);
        }
      } catch (error) {
        console.error("Toggle status error:", error);
        toast.error("An unexpected error occurred.");
      }
    });
  };

  const handleViewDetails = (product: ProductColumn) => {
    setDetailedProduct(null); // Clear previous details
    setIsDetailsLoading(true);
    setIsDetailsSheetOpen(true);
    startTransition(async () => {
      try {
        const response = await getProductDetails(
          organizationId,
          product.id,
        );
        if (response.success && response.data) {
          setDetailedProduct(response.data);
        } else {
          toast.error(`Error: ${response.error || "Failed to fetch details."}`);
          setIsDetailsSheetOpen(false); // Close sheet on error
        }
      } catch (e) {
        console.log(e)
        toast.error("Failed to fetch product details.");
        setIsDetailsSheetOpen(false); // Close sheet on error
      } finally {
        setIsDetailsLoading(false);
      }
    });
  };

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(
    () =>
      getColumns({
        onEdit: handleEdit,
        onDelete: handleDeleteConfirm,
        onToggleStatus: handleToggleStatus,
        onViewDetails: handleViewDetails,
      }),
    [handleToggleStatus, handleViewDetails]
  ); // Add dependencies that might change handlers

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Product Management
              </CardTitle>
              <CardDescription>
                View, add, edit, and manage your products. Total: {totalCount}
              </CardDescription>
            </div>
            <Button
              onClick={handleAddNew}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Pass client-side managed product state to table */}
          <ProductTable columns={columns} data={products} searchKey="name" />
        </CardContent>
      </Card>

      {/* Create/Edit Product Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg w-[90vw] overflow-y-auto">
          {" "}
          {/* Adjust width, add scroll */}
          <SheetHeader>
            <SheetTitle>
              {editingProduct ? "Edit Product" : "Create New Product"}
            </SheetTitle>
            <SheetDescription>
              {editingProduct
                ? "Update the details of this product."
                : "Fill in the details to add a new product."}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <ProductForm
              initialData={
                editingProduct
                  ? products.find((p) => p.id === editingProduct.id)
                  : null
              } // Pass full initial data if needed by form
              onSuccess={refreshData} // Refresh data on success
              categories={categories}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* View Details Sheet */}
      <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
        <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Product Details</SheetTitle>
            <SheetClose />
          </SheetHeader>
          <div className="py-4 space-y-4">
            {isDetailsLoading && (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
              </div>
            )}
            {detailedProduct && !isDetailsLoading && (
              <>
                <h3 className="text-lg font-semibold">
                  {detailedProduct.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {detailedProduct.description || "No description."}
                </p>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      SKU:
                    </span>{" "}
                    {detailedProduct.sku || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Category:
                    </span>{" "}
                    {detailedProduct.categoryName || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Unit:
                    </span>{" "}
                    {detailedProduct.unit}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Type:
                    </span>{" "}
                    {detailedProduct.type}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Status:
                    </span>
                    <Badge
                      variant={detailedProduct.isActive ? "default" : "destructive"}
                      className="ml-2"
                    >
                      {detailedProduct.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Selling Price:
                    </span>{" "}
                    {formatCurrency(detailedProduct.currentSellingPrice)}
                  </div>
                </div>
                <Separator />
                <h4 className="font-semibold">Stock Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Current Quantity:
                    </span>{" "}
                    {formatDecimal(detailedProduct.currentStockQuantity)}{" "}
                    {detailedProduct.unit}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      No. of Batches:
                    </span>{" "}
                    {detailedProduct.numberOfStockBatches}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Avg. Buying Price:
                    </span>{" "}
                    {formatCurrency(detailedProduct.averageBuyingPrice)}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Current Stock Value:
                    </span>{" "}
                    {formatCurrency(detailedProduct.currentStockValue)}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Potential Profit (Current Stock):
                    </span>{" "}
                    {formatCurrency(
                      detailedProduct.potentialProfitOnCurrentStock
                    )}
                  </div>
                </div>
                <Separator />
                <h4 className="font-semibold">Sales History</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Total Units Sold:
                    </span>{" "}
                    {formatDecimal(detailedProduct.totalUnitsSold)}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Total Revenue:
                    </span>{" "}
                    {formatCurrency(detailedProduct.totalRevenueGenerated)}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Estimated Profit:
                    </span>{" "}
                    {formatCurrency(
                      detailedProduct.estimatedTotalProfitGenerated
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Last Ordered:
                    </span>{" "}
                    {detailedProduct.lastOrderDate
                      ? detailedProduct.lastOrderDate.toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product
              <span className="font-semibold"> &quot;{productToDelete?.name}&quot;</span>.
              This might fail if the product has existing stock or transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper formatting functions (move to utils if needed)
function formatCurrency(amount: Decimal | number | null | undefined): string {
  if (amount === null || amount === undefined) return "-";
  const num = typeof amount === "number" ? amount : amount.toNumber();
  // TODO: Use organization's currency settings
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KES",
  }).format(num);
}

function formatDecimal(decimal: Decimal | null | undefined): string {
  if (decimal === null || decimal === undefined) return "-";
  const num = typeof decimal === "number" ? decimal : decimal; // Keep as Decimal for formatting
  return num.toFixed(num.decimalPlaces() > 0 ? 2 : 0);
}
