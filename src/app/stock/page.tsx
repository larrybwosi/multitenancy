import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import OverviewTab from "./components/overview";
import InventoryTab from "./components/inventory";
import TransactionsTab from "./components/transactions";
import { getInventoryOverview } from "@/actions/stock";

const StockManagementPage = async () => {
  // TODO: Replace with proper auth integration once the auth system is properly configured
  const organizationId = 'org1'; // Default organization ID
  
  const { data } = await getInventoryOverview(organizationId);
  
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
            recentTransactions={data?.recentTransactions || []}
            organizationId={organizationId}
          />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryTab organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsTab organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockManagementPage;
