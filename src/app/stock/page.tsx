import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import OverviewTab from "./components/overview";
import InventoryTab from "./components/inventory";
import TransactionsTab from "./components/transactions";
import { getInventoryOverview } from "@/actions/stock";
import { recentTransactions } from "./mock-data";

const StockManagementPage = async () => {
  const { data } = await getInventoryOverview('org1', 1);
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Stock Management</h1>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab 
            totalItems={data?.totalItems || 0}
            totalValue={data?.totalValue || 0}
            outOfStockCount={data?.outOfStockCount || 0}
            lowStockCount={data?.lowStockCount || 0}
            recentTransactions={recentTransactions}
          />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryTab />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockManagementPage;
