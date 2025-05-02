'use client';
import { PosClientWrapper } from "./components/PosClientWrapper";
import { useProducts } from "@/lib/hooks/use-products";
import { useCustomers } from "@/lib/hooks/use-customers";
import { Skeleton } from "@/components/ui/skeleton";

export default function PosPage() {

  const { data: products, isLoading: isLoadingProducts } = useProducts({
    includeCategory: true,
    includeVariants: true,
    limit:50,
    page:1,
    sortBy: "createdAt",
  });
  const { data: customers, isLoading: isLoadingCustomers } = useCustomers();
console.log(products)
  if (isLoadingProducts || isLoadingCustomers) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="w-1/2 h-1/2" />
        <div className="flex flex-col items-center justify-center space-y-4">
          <Skeleton className="w-1/3 h-8" />
          <Skeleton className="w-1/3 h-8" />
        </div>
      </div>
    );
  }
  return (
    <PosClientWrapper products={products?.data ?? []} customers={customers}/>
  );
}
