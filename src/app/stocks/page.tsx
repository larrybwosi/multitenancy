import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverviewTab from "./components/overview-tab";
import PastBatchesTab from "./components/past-batches-tab";
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
import {
  BarChart3,
  Package2,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";


// --- Main Data Fetching Component ---
async function StockPageData() {
  // Fetch initial data needed for the tabs directly on the server
  const [productData, categoryData, activeBatchesData, pastBatchesData] =
    await Promise.all([
      getProducts({ includeCategory: true }),
      getCategories(),
      getStockBatches({ activeOnly: true, includeProduct: true }),
      getPastStockBatches({ includeProduct: true }),
    ]);

  // Enhanced error handling with better UI
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
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 flex items-center space-x-4">
          <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
          <div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">
              Error Loading Data
            </h3>
            <p className="text-red-600 dark:text-red-400">
              We couldn&rsquo;t load your stock data. Please check your
              connection and try again.
            </p>
            <button
              className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 
                text-red-600 dark:text-red-200 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Tabs component with icons and better styling
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-50 dark:bg-gray-800/30 p-1.5 rounded-xl">
        <TabsTrigger
          value="overview"
          className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md transition-all duration-200"
        >
          <BarChart3 className="h-4 w-4" />
          <span>Overview</span>
        </TabsTrigger>
        <TabsTrigger
          value="products"
          className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md transition-all duration-200"
        >
          <Package2 className="h-4 w-4" />
          <span>Products & Batches</span>
        </TabsTrigger>
        <TabsTrigger
          value="past-batches"
          className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md transition-all duration-200"
        >
          <Clock className="h-4 w-4" />
          <span>Past Batches</span>
        </TabsTrigger>
      </TabsList>

      {/* Enhanced Tab Contents with better card styling */}
      <TabsContent
        value="overview"
        className="focus-visible:outline-none focus-visible:ring-0"
      >
        <Card className="border-none shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Inventory Overview</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  A comprehensive summary of your current stock status.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <OverviewTab
              initialProducts={productData.products ?? []}
              initialBatches={activeBatchesData.batches ?? []}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent
        value="past-batches"
        className="focus-visible:outline-none focus-visible:ring-0"
      >
        <Card className="border-none shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Past Stock Batches</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  History of depleted or expired stock batches in a searchable
                  grid.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <PastBatchesTab
              initialPastBatches={pastBatchesData.batches ?? []}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// --- Enhanced Page Component ---
export default async function StocksPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
      <div className="flex items-center mb-8 space-x-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <Package2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Stock Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track and manage your inventory with ease
          </p>
        </div>
      </div>

      <Suspense>
        <StockPageData />
      </Suspense>
    </div>
  );
}
