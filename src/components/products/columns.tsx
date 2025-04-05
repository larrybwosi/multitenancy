"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Decimal } from "@prisma/client/runtime/library";

// Define a type for the data structure expected by the table
// Include optional fields fetched for the list view
export type ProductColumn = {
  id: string;
  name: string;
  sku: string | null;
  categoryName: string | null | undefined; // from include
  currentSellingPrice: Decimal;
  isActive: boolean;
  stockQuantity?: Decimal | null; // from includeCurrentStock
  unit: string;
};

// Props for action handlers passed down to columns
interface ProductTableActions {
  onEdit: (product: ProductColumn) => void;
  onDelete: (product: ProductColumn) => void;
  onToggleStatus: (product: ProductColumn) => void;
  onViewDetails: (product: ProductColumn) => void; // Add handler for viewing details
}

export const getColumns = (
  actions: ProductTableActions
): ColumnDef<ProductColumn>[] => [
  // If you need row selection:
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={table.getIsAllPageRowsSelected()}
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => row.getValue("sku") || "-",
  },
  {
    accessorKey: "categoryName", // Assuming fetched via include
    header: "Category",
    cell: ({ row }) => row.original.categoryName || "-", // Use original row data
  },
  {
    accessorKey: "currentSellingPrice",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Price
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("currentSellingPrice") as Decimal;
      // TODO: Add currency formatting based on organization settings
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "KES", // Example: Kenyan Shilling - Make dynamic
      }).format(amount.toNumber()); // Convert Decimal to number for formatting

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "stockQuantity", // Assuming fetched via includeCurrentStock
    header: "Stock",
    cell: ({ row }) => {
      const quantity = row.original.stockQuantity;
      const unit = row.original.unit;
      if (quantity === undefined || quantity === null) {
        return "-";
      }
      const formattedQuantity = quantity.toFixed(
        quantity.decimalPlaces() > 0 ? 2 : 0
      ); // Show decimals if present
      return `${formattedQuantity} ${unit}`;
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive");
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;

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
            <DropdownMenuItem onClick={() => actions.onViewDetails(product)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEdit(product)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onToggleStatus(product)}>
              {product.isActive ? (
                <XCircle className="mr-2 h-4 w-4 text-amber-600" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
              )}
              {product.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-700 focus:bg-red-50"
              onClick={() => actions.onDelete(product)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Custom Badge Variants (in globals.css or a theme file)
/*
@layer components {
  .badge-success { @apply border-transparent bg-emerald-500 text-emerald-50 hover:bg-emerald-500/80; }
  .badge-warning { @apply border-transparent bg-amber-500 text-amber-50 hover:bg-amber-500/80; }
}
*/
// Or configure in tailwind.config.js
