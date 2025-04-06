// app/stocks/components/product-columns.tsx
"use client";

import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Product, Category, ProductVariant } from "@prisma/client";
import {
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  PackagePlus,
  Trash2,
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
import { Checkbox } from "@/components/ui/checkbox"; // If needed for row selection

// Define the expected data type including relations fetched in the server action
export type ProductWithRelations = Product & {
  category: Category | null; // Allow null category just in case
  variants?: ProductVariant[]; // Optional variants
  _count?: { stockBatches?: number }; // Optional count
  totalStock: number; // Calculated total stock
};

// Define props for the column definition function
interface ProductColumnsProps {
  onEdit: (product: ProductWithRelations) => void;
  onRestock: (product: ProductWithRelations) => void;
  // Add onDelete later if needed: onDelete: (productId: string) => void;
}

const columnHelper = createColumnHelper<ProductWithRelations>();

export const productColumns = ({
  onEdit,
  onRestock,
}: ProductColumnsProps): ColumnDef<ProductWithRelations>[] => [
  // Optional: Select column
  // {
  //   id: 'select',
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
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Product Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor("sku", {
    header: "SKU",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("category.name", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Category
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) =>
      info.getValue() ?? (
        <span className="text-muted-foreground italic">N/A</span>
      ),
    sortingFn: "alphanumeric", // Basic sorting for category name
    filterFn: "equalsString", // Enable filtering by category name
  }),
  columnHelper.accessor("basePrice", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-right w-full justify-end" // Align header right
      >
        Price
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => {
      const amount = parseFloat(info.getValue() as unknown as string); // Prisma Decimal can be string like
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD", // TODO: Make currency dynamic if needed
      }).format(amount);
      return <div className="text-right">{formatted}</div>;
    },
    sortingFn: "basic", // Use basic numeric sorting
  }),
  columnHelper.accessor("totalStock", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-center w-full justify-center"
      >
        Stock Qty
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => {
      const stock = info.getValue();
      const reorderPoint = info.row.original.reorderPoint;
      let variant: "default" | "destructive" | "secondary" | "outline" =
        "secondary";
      if (stock <= 0) {
        variant = "destructive";
      } else if (stock <= reorderPoint) {
        variant = "outline"; // Use outline for low stock warning
      }
      return (
        <div className="text-center">
          <Badge variant={variant}>{stock}</Badge>
        </div>
      );
    },
    sortingFn: "basic",
  }),
  columnHelper.accessor("reorderPoint", {
    header: "Reorder Pt.",
    cell: (info) => <div className="text-center">{info.getValue()}</div>,
  }),
  columnHelper.accessor("isActive", {
    header: "Status",
    cell: (info) =>
      info.getValue() ? (
        <Badge variant="default">Active</Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
      ),
    filterFn: (row, id, value) => {
      // Custom filter for boolean
      return value === String(row.getValue(id));
    },
  }),
  columnHelper.display({
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
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Product
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRestock(product)}>
              <PackagePlus className="mr-2 h-4 w-4" />
              Add Stock / Restock
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Add delete later if needed */}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            //   onClick={() => onDelete(product.id)} // Add onDelete handler later
            >
                <Trash2 className="mr-2 h-4 w-4" />
              Delete Product (Caution)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
];
