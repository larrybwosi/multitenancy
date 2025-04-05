import { Suspense } from "react";
import { mockProducts, mockCategories, mockCustomers } from "./lib/mock-data";
import POSPageContent from "./components/client-page";
import { listProducts } from "@/actions/products";

export default async function POSPage() {
  const products = await listProducts({});
  console.log(products)
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Loading POS...
        </div>
      }
    >
      <POSPageContent
        initialProducts={mockProducts}
        initialCategories={mockCategories}
        initialCustomers={mockCustomers}
      />
    </Suspense>
  );
}
