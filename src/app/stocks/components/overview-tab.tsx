// app/stocks/components/overview-tab.tsx
'use client'; // Because it uses client chart components

import React from 'react';
import { Product, Category, StockBatch, ProductVariant } from '@prisma/client';
// import InventoryValueChart from './charts/inventory-value-chart';
// import LowStockItemsChart from './charts/low-stock-items-chart'; // Create this component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    // Add other relations if needed by charts
};

interface OverviewTabProps {
  initialProducts: ProductWithRelations[];
  initialBatches: StockBatchWithRelations[];
}

export default function OverviewTab({ initialProducts, initialBatches }: OverviewTabProps) {
    // Calculate some KPIs
    const totalStockValue = initialBatches.reduce((sum, batch) => {
         const purchasePrice = typeof batch.purchasePrice === 'number'
            ? batch.purchasePrice
            : parseFloat(batch.purchasePrice?.toString() ?? '0');
        return sum + (purchasePrice * batch.currentQuantity);
    }, 0);
    const totalItemsInStock = initialProducts.reduce((sum, product) => sum + product.totalStock, 0);
    const lowStockProducts = initialProducts.filter(p => p.totalStock > 0 && p.totalStock <= p.reorderPoint).length;
    const outOfStockProducts = initialProducts.filter(p => p.totalStock <= 0).length;


    // Ensure batches passed to chart have product info
    const batchesWithProduct = initialBatches.filter(b => b.product) as (StockBatch & { product: Product })[];


  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inventory Value
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(totalStockValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on purchase price
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Items in Stock
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalItemsInStock.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Products
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 9v2m0 4h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              Items at or below reorder point
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Out of Stock Products
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              Products with zero stock
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Value by Product</CardTitle>
          </CardHeader>
          <CardContent>
            {/* <InventoryValueChart batches={batchesWithProduct} /> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Create and use the LowStockItemsChart component */}
            {/* <LowStockItemsChart products={initialProducts} /> */}
            <p className="text-muted-foreground p-4 text-center">
              (Low Stock Chart Component Placeholder)
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}