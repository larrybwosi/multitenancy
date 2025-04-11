import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Package2 } from "lucide-react";
import ProductsTab from "./components/products-tab";
import {
  getProducts,
  getCategories,
  getStockBatches,
} from "@/actions/stockActions";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default async function ProductsPage() {
  
  const [productData, categoryData, activeBatchesData] =
    await Promise.all([
      getProducts({ includeCategory: true }),
      getCategories(),
      getStockBatches({ activeOnly: true, includeProduct: true }),
    ]);
  return (
    <Card className="border-none shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader>
        <SectionHeader
          title="Products"
          subtitle="Manage your products efficiently and effectively"
          icon={<Package2 className="h-8 w-8 text-blue-800" />}
          autoUpdate="2 min"
        />
      </CardHeader>

      <CardContent className="p-6">
        <ProductsTab
          initialProducts={productData.products ?? []}
          initialCategories={categoryData.categories ?? []}
          initialActiveBatches={activeBatchesData.batches ?? []}
        />
      </CardContent>
    </Card>
  );
}
