// components/stocks/stock-batches-tab.tsx (Active Batches)

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MoreHorizontal, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getActiveStockBatches,
  StockBatchWithRelations,
} from "@/lib/actions/stock.actions";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { BatchDetailsSheetTrigger } from "./batch-details-sheet"; // Create this trigger component

export async function StockBatchesTab() {
  const batches = await getActiveStockBatches();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Stock Batches</CardTitle>
        <CardDescription>
          Individual batches currently in stock.
        </CardDescription>
        {/* Add Filtering/Sorting options here */}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product / Variant</TableHead>
                <TableHead className="hidden md:table-cell">
                  Batch Info
                </TableHead>
                <TableHead className="text-right">Current Qty</TableHead>
                <TableHead className="text-right hidden sm:table-cell">
                  Cost/Unit
                </TableHead>
                <TableHead className="hidden lg:table-cell">Received</TableHead>
                <TableHead className="hidden xl:table-cell">Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No active stock batches found.
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((batch) => (
                  <TableRow
                    key={batch.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      {batch.product.name}
                      {batch.variant && (
                        <span className="block text-xs text-muted-foreground">
                          ({batch.variant.name})
                        </span>
                      )}
                      <span className="block text-xs text-muted-foreground">
                        SKU: {batch.variant?.sku ?? batch.product.sku}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {batch.batchNumber && (
                        <div>Batch #: {batch.batchNumber}</div>
                      )}
                      {batch.purchaseItem?.purchase?.purchaseNumber && (
                        <div>
                          PO: {batch.purchaseItem.purchase.purchaseNumber}
                        </div>
                      )}
                      {!batch.batchNumber &&
                        !batch.purchaseItem?.purchase?.purchaseNumber && (
                          <div>ID: ...{batch.id.slice(-6)}</div>
                        )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {batch.currentQuantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {formatCurrency(batch.purchasePrice)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {format(new Date(batch.receivedDate), "PP")}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {batch.expiryDate ? (
                        format(new Date(batch.expiryDate), "PP")
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                      {/* Add warning badge if expiring soon */}
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Use Sheet Trigger Component */}
                      <BatchDetailsSheetTrigger batchId={batch.id}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" /> Details
                        </Button>
                      </BatchDetailsSheetTrigger>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {/* Add Pagination Controls Here */}
      </CardContent>
    </Card>
  );
}

// Create PastBatchesTab similarly, calling `getPastStockBatches`
// Adjust columns if needed (e.g., show 'Depleted Date' instead of 'Received Date')
