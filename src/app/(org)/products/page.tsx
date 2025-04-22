import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Package2 } from "lucide-react";
import ProductsTab from "./components/products-tab";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getProducts } from "@/actions/products";
import { getCategories } from "@/actions/category.actions";

export default async function ProductsPage() {
  
  const [productData, categoryData] =
    await Promise.all([
      getProducts({ includeCategory: true }),
      getCategories(),
    ]);
    
  return (
    <Card className="border-none shadow-lg flex-1 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader>
        <SectionHeader
          title="Products"
          subtitle="Manage your products efficiently and effectively"
          icon={<Package2 className="h-8 w-8 text-blue-800" />}
        />
      </CardHeader>

      <CardContent className="px-6">
        <ProductsTab
          //@ts-expect-error base prise is string
          initialProducts={productData.data ?? []}
          initialCategories={categoryData ?? []}
        />
      </CardContent>
    </Card>
  );
}
