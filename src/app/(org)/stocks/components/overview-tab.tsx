"use client";

import React from "react";
import { Product, Category, StockBatch, ProductVariant } from "@/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart } from "./charts/pie";
import { BarChart } from "./charts/bar";

type ProductWithRelations = Product & {
  category: Category;
  variants: ProductVariant[];
  _count: { stockBatches: number };
  totalStock: number;
};

type StockBatchWithRelations = StockBatch & {
  product: Product;
  variant: ProductVariant | null;
};

interface OverviewTabProps {
  initialProducts: ProductWithRelations[];
  initialBatches: StockBatchWithRelations[];
}

export default function OverviewTab({
  initialProducts,
  initialBatches,
}: OverviewTabProps) {
  // Calculate KPIs
  const totalStockValue = initialBatches.reduce((sum, batch) => {
    const purchasePrice =
      typeof batch.purchasePrice === "number"
        ? batch.purchasePrice
        : parseFloat(batch.purchasePrice?.toString() ?? "0");
    return sum + purchasePrice * batch.currentQuantity;
  }, 0);

  const totalItemsInStock = initialProducts.reduce(
    (sum, product) => sum + product.totalStock,
    0
  );
  const lowStockProducts = initialProducts.filter(
    (p) => p.totalStock > 0 && p.totalStock <= p.reorderPoint
  ).length;
  const outOfStockProducts = initialProducts.filter(
    (p) => p.totalStock <= 0
  ).length;

  // Prepare data for charts
  const inventoryValueData = initialBatches
    .filter((b) => b.product)
    .map((batch) => ({
      name: batch.product.name,
      value:
        (typeof batch.purchasePrice === "number"
          ? batch.purchasePrice
          : parseFloat(batch.purchasePrice?.toString() ?? "0")) *
        batch.currentQuantity,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const lowStockData = initialProducts
    .filter((p) => p.totalStock > 0 && p.totalStock <= p.reorderPoint)
    .map((product) => ({
      name: product.name,
      value: product.totalStock,
      reorderPoint: product.reorderPoint,
    }))
    .sort((a, b) => a.value - b.value);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Total Inventory Value
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-blue-600"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(totalStockValue)}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Based on purchase price
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              Total Items in Stock
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
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
                className="h-4 w-4 text-green-600"
              >
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {totalItemsInStock.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1">Across all products</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">
              Low Stock Products
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
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
                className="h-4 w-4 text-amber-600"
              >
                <path d="M12 9v2m0 4h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              {lowStockProducts}
              {lowStockProducts > 0 && (
                <Badge variant="destructive" className="ml-2 animate-pulse">
                  Attention Needed
                </Badge>
              )}
            </div>
            <p className="text-xs text-amber-600 mt-1">
              Items at or below reorder point
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              Out of Stock Products
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
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
                className="h-4 w-4 text-red-600"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {outOfStockProducts}
              {outOfStockProducts > 0 && (
                <Badge variant="destructive" className="ml-2">
                  Urgent
                </Badge>
              )}
            </div>
            <p className="text-xs text-red-600 mt-1">
              Products with zero stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Inventory Value by Product
              <span className="block text-sm font-normal text-gray-500 mt-1">
                Top 10 highest value products
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <BarChart
              data={inventoryValueData}
              colors={["#3b82f6", "#1d4ed8", "#2563eb", "#1e40af"]}
              xAxis="name"
              yAxis="value"
              valueFormatter={(value: number) =>
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(value)
              }
            />
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Low Stock Items
              <span className="block text-sm font-normal text-gray-500 mt-1">
                Items below reorder threshold
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {lowStockData.length > 0 ? (
              <PieChart
                data={lowStockData.map((item) => ({
                  name: item.name,
                  value: item.value,
                  reorderPoint: item.reorderPoint,
                }))}
                colors={["#f59e0b", "#ef4444", "#f97316", "#ec4899"]}
                tooltipFormatter={(value: number, name: string, props: any) =>
                  `<strong>${name}</strong><br/>
                  Current: ${value}<br/>
                  Reorder at: ${props.payload.reorderPoint}`
                }
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
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
                  className="h-12 w-12 text-green-500 mb-2"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">
                  All stocked up!
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  No items are currently below their reorder points.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
