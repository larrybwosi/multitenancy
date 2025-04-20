import PosClientPage from "./components/client";
import { Suspense } from "react";
import type { CategoryInfo } from "./types"; // Import the new type
import { getCategories } from "@/actions/category.actions";

const LOCATION_ID = "cm9e4ynql0000bkacheb1jxcd"; // IMPORTANT: Get this from session/context/env

export default async function PosPage() {
  // Fetch actual categories server-side
  const categoriesResult = await getCategories(); // Call the new action
  const categories: CategoryInfo[] = Array.isArray(categoriesResult)
    ? categoriesResult
    : [];

  if (!LOCATION_ID) {
    console.error("POS Page Error: LOCATION_ID is not configured.");
    return (
      <div className="p-4 text-red-500">
        Error: Store location is not configured.
      </div>
    );
  }

  // Add an 'All' category for the UI filter
  const allCategories = [
    {
      id: "all",
      name: "All",
      description: null,
      parentId: null,
      _count: { products: 0 },
    }, // Use 'all' as a special ID
    ...categories,
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Suspense
        fallback={
          <div className="flex h-screen w-full items-center justify-center">
            Loading POS...
          </div>
        }
      >
        <PosClientPage
          categories={allCategories} // Pass fetched categories + 'All'
          locationId={LOCATION_ID} // Pass locationId down
        />
      </Suspense>
    </div>
  );
}
