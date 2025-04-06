// app/stocks/components/batch-columns.tsx
"use client";

import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { StockBatch, Product, ProductVariant } from "@prisma/client";
import { ArrowUpDown, MoreHorizontal, Eye } from "lucide-react"; // Removed unused icons
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns"; // For formatting dates

// Define the expected data type including relations
export type StockBatchWithRelations = StockBatch & {
  product: Product | null; // Allow null product
  variant?: ProductVariant | null; // Allow null variant
  purchaseItem?: any; // Adjust type as needed
  // Add other relations if included
};

// Define props for the column definition function
interface BatchColumnsProps {
  isPastBatchView?: boolean; // Flag to slightly change behavior for past batches
  onViewDetails?: (batch: StockBatchWithRelations) => void; // Optional: Handler for viewing details
}

const columnHelper = createColumnHelper<StockBatchWithRelations>();

export const batchColumns = ({
  isPastBatchView = false,
  onViewDetails,
}: BatchColumnsProps = {}): ColumnDef<StockBatchWithRelations>[] => [
  columnHelper.accessor("product.name", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Product Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => (
      <span className="font-medium">
        {info.getValue() ?? (
          <span className="text-muted-foreground italic">N/A</span>
        )}
      </span>
    ),
    filterFn: "includesString", // Allow filtering by product name
  }),
  columnHelper.accessor("product.sku", {
    header: "SKU",
    cell: (info) => info.row.original.product?.sku ?? "-", // Access via original product data
  }),
  // Add Variant column if needed
  // columnHelper.accessor('variant.name', {
  //   header: 'Variant',
  //   cell: info => info.getValue() ?? '-',
  // }),
  columnHelper.accessor("batchNumber", {
    header: "Batch #",
    cell: (info) =>
      info.getValue() ?? (
        <span className="text-muted-foreground italic">None</span>
      ),
  }),
  columnHelper.accessor("purchasePrice", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-right w-full justify-end"
      >
        Unit Cost
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => {
      const amount = parseFloat(info.getValue() as unknown as string);
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="text-right">{formatted}</div>;
    },
    sortingFn: "basic",
  }),
  columnHelper.accessor("initialQuantity", {
    header: "Initial Qty",
    cell: (info) => <div className="text-center">{info.getValue()}</div>,
  }),
  columnHelper.accessor("currentQuantity", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center w-full justify-center"
      >
        Current Qty
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => (
      <div className="text-center font-semibold">{info.getValue()}</div>
    ),
    sortingFn: "basic",
  }),
  columnHelper.accessor("receivedDate", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Received
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => format(new Date(info.getValue()), "PP"), // Format date nicely
    sortingFn: "datetime",
  }),
  columnHelper.accessor("expiryDate", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Expiry
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => {
      const date = info.getValue();
      if (!date)
        return <span className="text-muted-foreground italic">N/A</span>;
      const expiry = new Date(date);
      const isExpired = expiry < new Date();
      return (
        <span className={isExpired ? "text-destructive font-medium" : ""}>
          {format(expiry, "PP")}
        </span>
      );
    },
    sortingFn: "datetime",
  }),
  columnHelper.accessor("location", {
    header: "Location",
    cell: (info) =>
      info.getValue() ?? (
        <span className="text-muted-foreground italic">N/A</span>
      ),
  }),
  // Optional: Actions column only if needed (e.g., for active batches)
  // Modify this based on whether onViewDetails is provided and if it's not the past batch view
  ...(onViewDetails && !isPastBatchView
    ? [
        columnHelper.display({
          id: "actions",
          cell: ({ row }) => {
            const batch = row.original;

            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  {onViewDetails && (
                    <DropdownMenuItem onClick={() => onViewDetails(batch)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                  )}
                  {/* Add other actions if needed: Adjust Qty, Move Location, etc. */}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
        }),
      ]
    : []),
];
