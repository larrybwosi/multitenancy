import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MoreHorizontal,
  PackagePlus,
  Pencil,
  Boxes,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { ProductWithStock } from "@/lib/types";
import { getProducts } from "@/actions/products";
// Import Dialog and ProductForm if adding products here
// import { ProductAddDialog } from './product-add-dialog';
// Import Dialog/Sheet for Stock Adjustment
// import { StockAdjustmentDialog } from './stock-adjustment-dialog';

export async function CurrentStockTab() {
  const products = await getProducts();

  const isLowStock = (product: ProductWithStock) => {
    // Basic check: total stock <= reorder point
    // More complex logic might be needed (e.g., considering incoming stock)
    return product.totalStock <= product.reorderPoint;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center gap-4">
          <div>
            <CardTitle>Current Product Stock</CardTitle>
            <CardDescription>
              Overview of products and their total available stock levels.
            </CardDescription>
          </div>
          {/* Placeholder for Add Product Dialog Trigger */}
          <Button size="sm" variant="outline" disabled>
            {" "}
            {/* Replace with Dialog Trigger */}
            <PackagePlus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="hidden sm:table-cell">SKU</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="text-right">Total Stock</TableHead>
                <TableHead className="text-right hidden lg:table-cell">
                  Reorder Pt.
                </TableHead>
                <TableHead className="text-right hidden md:table-cell">
                  Base Price
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No products found or no stock available.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow
                    key={product.id}
                    className={`hover:bg-muted/50 transition-colors ${isLowStock(product) ? "bg-orange-50 dark:bg-orange-900/30" : ""}`}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isLowStock(product) && (
                          <AlertCircle
                            className="h-4 w-4 text-orange-500 flex-shrink-0"
                            title="Low Stock"
                          />
                        )}
                        <span>{product.name}</span>
                      </div>
                      {product.variants.length > 0 && (
                        <span className="text-xs text-muted-foreground pl-2 block">
                          ({product.variants.length} Variants)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {product.sku}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {product.category?.name ?? "N/A"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {product.totalStock.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell text-muted-foreground">
                      {product.reorderPoint}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {formatCurrency(product.basePrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage</DropdownMenuLabel>
                          {/* Link to Product Edit Page/Dialog */}
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/products/${product.id}/edit`}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Pencil className="h-4 w-4" /> Edit Product
                            </Link>
                          </DropdownMenuItem>
                          {/* Trigger Stock Adjustment Dialog/Sheet */}
                          <DropdownMenuItem
                            disabled
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            {" "}
                            {/* Replace with Dialog Trigger */}
                            <PackagePlus className="h-4 w-4" /> Adjust Stock
                          </DropdownMenuItem>
                          {/* Link/Filter to view specific batches */}
                          <DropdownMenuItem
                            disabled
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            {" "}
                            {/* Implement linking/filtering */}
                            <Boxes className="h-4 w-4" /> View Batches
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Placeholder Dialog Components (Create these as needed) ---
/*
// components/stocks/product-add-dialog.tsx
// ... Dialog component containing the ProductForm ...

// components/stocks/stock-adjustment-dialog.tsx
// ... Dialog component containing the StockAdjustmentForm ...
*/
