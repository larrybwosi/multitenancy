// app/stocks/page.tsx
import React, { Suspense } from "react"; // Import Suspense
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverviewTab from "./components/overview-tab";
import ProductsTab from "./components/products-tab";
import PastBatchesTab from "./components/past-batches-tab"; // Assuming this uses react-data-grid now
import {
  getProducts,
  getCategories,
  getStockBatches,
  getPastStockBatches,
} from "@/actions/stockActions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

export const dynamic = "force-dynamic"; // Ensure data is fetched fresh

// --- Skeleton Loader Component ---
function StocksPageSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 animate-pulse">
      <Skeleton className="h-9 w-1/2 mb-6" /> {/* Title */}
      <Skeleton className="h-10 w-full grid grid-cols-3 mb-6" />{" "}
      {/* Tabs List */}
      {/* Skeleton for a tab content card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-2" /> {/* Card Title */}
          <Skeleton className="h-4 w-2/3" /> {/* Card Description */}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Skeleton for filters/buttons */}
          <div className="flex items-center py-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-24 ml-auto" />
          </div>
          {/* Skeleton for table */}
          <Skeleton className="h-64 w-full rounded-md border" />
          {/* Skeleton for pagination */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Data Fetching Component ---
async function StockPageData() {
  // Fetch initial data needed for the tabs directly on the server
  const [productData, categoryData, activeBatchesData, pastBatchesData] =
    await Promise.all([
      getProducts({ includeCategory: true }),
      getCategories(),
      getStockBatches({ activeOnly: true, includeProduct: true }),
      getPastStockBatches({ includeProduct: true }), // Fetch data needed for react-data-grid
    ]);

  // Basic error handling
  if (
    productData.error ||
    categoryData.error ||
    activeBatchesData.error ||
    pastBatchesData.error
  ) {
    // Log detailed error on the server
    console.error("Error fetching stock data:", {
      productData,
      categoryData,
      activeBatchesData,
      pastBatchesData,
    });
    return (
      <div className="container mx-auto p-4 text-red-600">
        Error loading stock data. Please check server logs and try again later.
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="products">Products & Batches</TabsTrigger>
        <TabsTrigger value="past-batches">Past Batches (Sheet)</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
            <CardDescription>
              A summary of your current stock status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OverviewTab
              initialProducts={productData.products ?? []}
              initialBatches={activeBatchesData.batches ?? []}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="products">
        <Card>
          <CardHeader>
            <CardTitle>Products & Current Stock</CardTitle>
            <CardDescription>
              Manage your products and their active stock batches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductsTab
              initialProducts={productData.products ?? []}
              initialCategories={categoryData.categories ?? []}
              initialActiveBatches={activeBatchesData.batches ?? []}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="past-batches">
        <Card>
          <CardHeader>
            <CardTitle>Past Stock Batches (Sheet View)</CardTitle>
            <CardDescription>
              History of depleted or expired stock batches using
              react-data-grid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* PastBatchesTab now uses react-data-grid */}
            <PastBatchesTab
              initialPastBatches={pastBatchesData.batches ?? []}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// --- Page Component ---
export default async function StocksPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Stock Management</h1>
      <Suspense fallback={<StocksPageSkeleton />}>
        <StockPageData />
      </Suspense>
    </div>
  );
}
