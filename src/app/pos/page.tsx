'use client';
import { PosClientWrapper } from "./components/client-page";
import { useProducts } from "@/lib/hooks/use-products";
import { useCustomers } from "@/lib/hooks/use-customers";
import { ProductGridSkeleton } from "./components/skeleton-loader";

export default function PosPage() {

  const { data: products, isLoading: isLoadingProducts } = useProducts({
    includeCategory: true,
    includeVariants: true,
    limit:50,
    page:1,
    sortBy: "createdAt",
  });

  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({});
  
  if (isLoadingProducts || isLoadingCustomers) {
    return <ProductGridSkeleton/>
  }
  return <PosClientWrapper products={products?.data ?? []} customers={customersData?.success && customersData.data.customers} />;
}
