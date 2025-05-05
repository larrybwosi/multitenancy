// app/stocks/components/past-batches-tab.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Column, SortColumn, DataGrid } from "react-data-grid";
import { StockBatch, Product, ProductVariant, SaleItem } from "@/prisma/client";
import { format } from "date-fns";

// Import the necessary CSS. Ensure this path is correct for your setup.
// Option 1: Direct import (might need CSS loader configuration)
import 'react-data-grid/lib/styles.css';
// Option 2: If using Next.js App Router, import globally in layout.tsx or similar
// Make sure the styles are loaded.

// Define the type for past batches including relations
type PastStockBatchWithRelations = StockBatch & {
  product: Product | null;
  variant: ProductVariant | null;
  purchaseItem: any; // Adjust type
  saleItems?: Pick<SaleItem, "id" | "quantity" | "saleId">[];
};

interface PastBatchesTabProps {
  initialPastBatches: PastStockBatchWithRelations[];
}

// --- react-data-grid Columns Definition ---
const columns: readonly Column<PastStockBatchWithRelations>[] = [
  {
    key: "productName",
    name: "Product Name",
    resizable: true,
    sortable: true,
    // Derive value for sorting/display
    // formatter: ({ row }) => row.product?.name ?? "N/A",
  },
  {
    key: "sku",
    name: "SKU",
    width: 120,
    resizable: true,
    sortable: true,
    // formatter: ({ row }) => row.product?.sku ?? "-",
  },
  // { key: 'variantName', name: 'Variant', width: 100, formatter: ({row}) => row.variant?.name ?? '-' },
  {
    key: "batchNumber",
    name: "Batch #",
    width: 120,
    resizable: true,
    sortable: true,
    // formatter: ({ row }) => row.batchNumber ?? "-",
  },
  {
    key: "purchasePrice",
    name: "Unit Cost",
    width: 100,
    resizable: true,
    sortable: true,
    // formatter: ({ row }) => {
    //   const amount =
    //     typeof row.purchasePrice === "object"
    //       ? parseFloat(row.purchasePrice.toString()) // Handle Prisma Decimal
    //       : row.purchasePrice;
    //   return new Intl.NumberFormat("en-US", {
    //     style: "currency",
    //     currency: "USD",
    //   }).format(amount ?? 0);
    // },
  },
  {
    key: "initialQuantity",
    name: "Initial Qty",
    width: 90,
    resizable: true,
    sortable: true,
    // formatter: ({ row }) => (
    //   <div style={{ textAlign: "center" }}>{row.initialQuantity}</div>
    // ),
  },
  {
    key: "currentQuantity", // Should typically be 0 for past batches
    name: "Final Qty",
    width: 90,
    resizable: true,
    sortable: true,
  //   formatter: ({ row }) => (
  //     <div style={{ textAlign: "center" }}>{row.currentQuantity}</div>
  //   ),
  },
  {
    key: "receivedDate",
    name: "Received",
    width: 120,
    resizable: true,
    sortable: true,
    // formatter: ({ row }) => format(new Date(row.receivedDate), "PP"),
  },
  {
    key: "expiryDate",
    name: "Expiry",
    width: 120,
    resizable: true,
    sortable: true,
    // formatter: ({ row }) =>
    //   row.expiryDate ? format(new Date(row.expiryDate), "PP") : "-",
  },
  {
    key: "location",
    name: "Location",
    resizable: true,
    sortable: true,
    // formatter: ({ row }) => row.location ?? "-",
  },
  {
    key: "updatedAt", // Often indicates depletion date if currentQuantity reached 0
    name: "Date Depleted/Modified",
    width: 180,
    resizable: true,
    sortable: true,
    // formatter: ({ row }) => format(new Date(row.updatedAt), "PPpp"), // Show date and time
  },
  // Add more columns if needed (e.g., related sales info)
];

export default function PastBatchesTab({
  initialPastBatches,
}: PastBatchesTabProps) {
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
  const [rows, setRows] = useState(initialPastBatches); // Local state if needed for client-side ops

  // --- Client-side Sorting Logic ---
  const sortedRows = useMemo((): readonly PastStockBatchWithRelations[] => {
    if (sortColumns.length === 0) return rows;

    // Custom comparison logic here based on columnKey
    // This is simplified; complex types (dates, numbers stored as Decimal/string) need care
    return [...rows].sort((a, b) => {
      for (const sort of sortColumns) {
        let comp = 0;
        const key = sort.columnKey as keyof PastStockBatchWithRelations;

        // Example comparison - needs refinement for specific types
        let valA: any;
        let valB: any;

        // Access nested properties for sorting
        if (key === "productName") {
          valA = a.product?.name ?? "";
          valB = b.product?.name ?? "";
        } else if (key === "sku") {
          valA = a.product?.sku ?? "";
          valB = b.product?.sku ?? "";
        } else if (
          key === "receivedDate" ||
          key === "expiryDate" ||
          key === "updatedAt"
        ) {
          valA = a[key] ? new Date(a[key]!).getTime() : 0;
          valB = b[key] ? new Date(b[key]!).getTime() : 0;
        } else if (key === "purchasePrice") {
          valA =
            typeof a[key] === "object"
              ? parseFloat(a[key]!.toString() ?? "0")
              : (a[key] ?? 0);
          valB =
            typeof b[key] === "object"
              ? parseFloat(b[key]!.toString() ?? "0")
              : (b[key] ?? 0);
        } else {
          valA = a[key];
          valB = b[key];
        }

        if (valA > valB) {
          comp = 1;
        } else if (valA < valB) {
          comp = -1;
        }

        if (comp !== 0) {
          return sort.direction === "ASC" ? comp : -comp;
        }
      }
      return 0;
    });
  }, [rows, sortColumns]);

  // react-data-grid requires a specific class name for default styling
  // Ensure 'react-data-grid/lib/styles.css' is imported globally or locally
  const dataGridClassName = "rdg-light"; // Or "rdg-dark" based on theme preference

  return (
    <div style={{ height: 600 }}>
      {" "}
      {/* Set a height for the grid container */}
      <style jsx global>{`
        /* Import RDG styles if not done globally - adjust path if needed */
        @import "react-data-grid/lib/styles.css";

        /* Optional: Minor tweaks to better fit shadcn */
        .rdg {
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
        }
        .rdg-header-row {
          background-color: hsl(var(--muted));
        }
        .rdg-cell {
          border-color: hsl(var(--border));
          background-color: hsl(var(--card));
          color: hsl(var(--foreground));
        }
        .rdg-row:hover .rdg-cell {
          background-color: hsl(var(--muted));
        }

        /* Ensure vertical scrollbar is visible */
        .rdg {
          contain: strict; /* Helps with performance */
          height: 100%; /* Fill the container */
        }
      `}</style>
      <DataGrid
        columns={columns}
        rows={sortedRows}
        rowKeyGetter={(row) => row.id} // Use batch ID as the key
        // className={dataGridClassName} // Apply the base class
        sortColumns={sortColumns}
        onSortColumnsChange={setSortColumns}
        style={{ height: "100%" }} // Make grid fill container height
        // Enable other features as needed:
        // onRowsChange={setRows} // If enabling editing
        // defaultColumnOptions={{
        //   sortable: true,
        //   resizable: true
        // }}
      />
    </div>
  );
}
