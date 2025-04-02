import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInventoryValuationReport, getLowStockReport, getStockTransactionHistory } from "@/actions/stock-management";
import { LineChart, ShoppingBag, AlertTriangle, Banknote, TrendingUp, BarChart3, Package, ArrowUpDown, RefreshCw } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import StockManagement from "@/components/inventory/stock-management";
import ProductsTable from "@/components/inventory/products-table";
import { InventoryValuationTable } from "@/components/inventory/components";
import { InventoryDashboardCharts, InventoryDistributionChart, InventoryValuePieChart, TopProductsChart } from "@/components/inventory/inventory-charts";
import BulkStockUpdate from "@/components/inventory/bulk-stock-update";
import { StockTransactions } from "@/components/inventory/stock-transactions";
import type { InventoryValuationReport, LowStockReport, StockTransactionHistory } from "@/lib/types/inventory";

export const metadata: Metadata = {
  title: "Inventory Management - ClevPOS",
  description: "Manage your inventory, track stock levels, and view valuations",
};

export default async function InventoryPage() {
  const valuation = await getInventoryValuationReport();
  const lowStockData = await getLowStockReport();
  
  // Default to last 30 days for transaction history
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const transactionHistory = await getStockTransactionHistory(thirtyDaysAgo, new Date());

  // Extract data from responses
  const { productValuation = [], summary = {} } = (valuation as InventoryValuationReport) || {};
  const lowStockItems = (lowStockData as LowStockReport)?.report || [];
  const transactions = (transactionHistory as StockTransactionHistory)?.transactions || [];

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Monitor stock levels, valuations, and manage inventory
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 h-auto sm:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stock">Stock Management</TabsTrigger>
          <TabsTrigger value="valuations">Valuations</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white dark:bg-gray-950 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Total Products
                </CardTitle>
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                  <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.totalProducts || 0}
                </div>
                <div className="mt-1 flex items-center">
                  <span className="text-xs text-muted-foreground">
                    Total unique products in inventory
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-950 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Total Stock Value
                </CardTitle>
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-900 p-2">
                  <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary?.totalCostValue || 0)}
                </div>
                <div className="mt-1 flex items-center">
                  <span className="text-xs text-muted-foreground">
                    Current value of inventory at cost
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-950 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Potential Profit
                </CardTitle>
                <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary?.totalPotentialProfit || 0)}
                </div>
                <div className="mt-1 flex items-center">
                  <span className="text-xs text-muted-foreground">
                    Potential profit from current inventory
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-950 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                  Low Stock Items
                </CardTitle>
                <div className="rounded-full bg-red-100 dark:bg-red-900 p-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockItems.length}</div>
                <div className="mt-1 flex items-center">
                  <span className="text-xs text-muted-foreground">
                    Products below minimum stock level
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1 overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Low Stock Alerts</CardTitle>
                    <CardDescription>
                      Products that need to be restocked soon
                    </CardDescription>
                  </div>
                  {lowStockItems.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {lowStockItems.length} items
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Top Products by Value
                </h3>
                <div className="h-[300px]">
                  <TopProductsChart data={productValuation} />
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
                <CardTitle>Inventory Value by Category</CardTitle>
                <CardDescription>
                  Distribution of inventory value across categories
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px] flex items-center justify-center">
                  <InventoryValuePieChart
                    data={
                      Array.isArray(productValuation)
                        ? Object.values(
                            productValuation.reduce(
                              (acc, product) => {
                                const category =
                                  product.categoryName || "Uncategorized";
                                if (!acc[category]) {
                                  acc[category] = {
                                    category: category,
                                    value: 0,
                                  };
                                }
                                acc[category].value += product.retailValue || 0;
                                return acc;
                              },
                              {} as Record<
                                string,
                                { category: string; value: number }
                              >
                            )
                          )
                        : []
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
              <CardTitle>Recent Stock Transactions</CardTitle>
              <CardDescription>
                Latest inventory movements and adjustments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="px-4 py-2">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-start space-x-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-900 border-b last:border-0"
                    >
                      <div
                        className={`rounded-full p-2 flex-shrink-0 ${
                          transaction.type === "PURCHASE"
                            ? "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300"
                            : transaction.type === "SALE"
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
                              : transaction.type === "ADJUSTMENT"
                                ? "bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-300"
                                : transaction.type === "RETURN"
                                  ? "bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-300"
                                  : // transaction.type === 'DAMAGED' ? 'bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-300' :
                                    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {transaction.type === "PURCHASE" ? (
                          <ShoppingBag className="h-4 w-4" />
                        ) : transaction.type === "SALE" ? (
                          <LineChart className="h-4 w-4" />
                        ) : transaction.type === "ADJUSTMENT" ? (
                          <ArrowUpDown className="h-4 w-4" />
                        ) : transaction.type === "RETURN" ? (
                          <RefreshCw className="h-4 w-4" />
                        ) : (
                          //  transaction.type === 'DAMAGED' ? <Trash2 className="h-4 w-4" /> :
                          <Package className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium">
                              {transaction.productName}
                            </p>
                            <Badge className="ml-2" variant="outline">
                              {transaction.type}
                            </Badge>
                          </div>
                          <time className="text-xs text-muted-foreground">
                            {format(
                              new Date(transaction.date),
                              "MMM d, yyyy HH:mm"
                            )}
                          </time>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transaction.type === "PURCHASE"
                            ? "Added"
                            : transaction.type === "SALE"
                              ? "Sold"
                              : transaction.type === "ADJUSTMENT"
                                ? "Adjusted"
                                : transaction.type === "RETURN"
                                  ? "Returned"
                                  : //  transaction.type === 'DAMAGED' ? 'Marked as damaged' :
                                    "Changed"}{" "}
                          {transaction.quantity} units at{" "}
                          {formatCurrency(transaction.unitPrice)} each
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-sm font-medium ${
                            transaction.type === "PURCHASE"
                              ? "text-red-600 dark:text-red-400"
                              : transaction.type === "SALE"
                                ? "text-green-600 dark:text-green-400"
                                : transaction.type === "RETURN"
                                  ? "text-purple-600 dark:text-purple-400"
                                  : // transaction.type === 'DAMAGED' ? 'text-red-600 dark:text-red-400' :
                                    "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {transaction.type === "PURCHASE" 
                          // || transaction.type === "DAMAGED"
                            ? "-"
                            : "+"}
                          {formatCurrency(transaction.totalAmount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Management Tab */}
        <TabsContent value="stock" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2 md:col-span-1 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.totalProducts || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unique products in inventory
                </p>
              </CardContent>
            </Card>

            <Card className="col-span-2 md:col-span-1 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Low Stock Items
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockItems.length}</div>
                <p className="text-xs text-muted-foreground">
                  Products below minimum level
                </p>
              </CardContent>
            </Card>

            <Card className="col-span-2 md:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Stock Value
                </CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary?.totalCostValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total inventory value at cost
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 md:col-span-1">
              <CardHeader>
                <CardTitle>Stock Management</CardTitle>
                <CardDescription>
                  Add or remove stock, record purchases and returns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StockManagement />
              </CardContent>
            </Card>

            <Card className="col-span-2 md:col-span-1">
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
                <CardDescription>
                  Products that need to be restocked soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {lowStockItems.length > 0 ? (
                      lowStockItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between space-x-4 rounded-lg border p-4"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {item.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.categoryName} • SKU: {item.sku || "N/A"}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                              <div className="flex items-center">
                                <Badge
                                  variant={
                                    item.currentStock === 0
                                      ? "destructive"
                                      : "outline"
                                  }
                                  className="ml-2"
                                >
                                  {item.currentStock} in stock
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Min: {item.minLevel}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex h-[200px] items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                          All stock levels are adequate
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bulk Stock Update</CardTitle>
              <CardDescription>
                Update multiple products at once with CSV import functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkStockUpdate />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Valuations Tab */}
        <TabsContent value="valuations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Cost Value
                </CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary?.totalCostValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total value at purchase price
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Retail Value
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary?.totalRetailValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total value at selling price
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Potential Gross Profit
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    (summary?.totalRetailValue || 0) -
                      (summary?.totalCostValue || 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Potential profit if all stock is sold
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Inventory Valuation</CardTitle>
                <CardDescription>
                  Detailed inventory valuation by product
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <InventoryValuationTable data={productValuation || []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Value Distribution</CardTitle>
              <CardDescription>
                Visual representation of inventory value distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <InventoryDistributionChart data={productValuation || []} />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Inventory Analysis</CardTitle>
              <CardDescription>
                Detailed visualization of inventory data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryDashboardCharts productData={productValuation || []} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Products Inventory</CardTitle>
              <CardDescription>
                Manage your products, prices, and stock levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductsTable />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Transactions</CardTitle>
              <CardDescription>
                View and manage all stock movements and adjustments
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full">
              <StockTransactions />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
