
import { getCategoriesWithStats, getCategoryOptions } from "@/actions/category.actions";
import { Suspense } from "react";
import { CategoryTable } from "./components/table";

// Optional: Add Loading UI
function LoadingSkeleton() {
  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <div className="h-10 w-36 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="rounded-md border p-4">
        <div className="h-8 w-full bg-gray-200 rounded mb-4 animate-pulse"></div>{" "}
        {/* Header */}
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 w-full bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function CategoriesPage() {
  // Fetch data in parallel
  const [categoriesData, categoryOptionsData] = await Promise.allSettled([
    getCategoriesWithStats(),
    getCategoryOptions(),
  ]);

  // Handle potential errors during data fetching
  if (categoriesData.status === "rejected") {
    console.error("Failed to load categories:", categoriesData.reason);
    // You could render an error component here
    return (
      <div className="text-red-500 p-4">
        Error loading categories. Please try again later.
      </div>
    );
  }
  if (categoryOptionsData.status === "rejected") {
    console.error(
      "Failed to load category options:",
      categoryOptionsData.reason
    );
    // Options might not be critical, could proceed with empty array or show warning
    return (
      <div className="text-red-500 p-4">
        Error loading category options. Please try again later.
      </div>
    );
  }

  const categories = categoriesData.value;
  const categoryOptions = categoryOptionsData.value;

  return (
    <div className="container mx-auto py-10">
      {/* Add Toaster provider */}
      <h1 className="text-3xl font-bold mb-6">Category Management</h1>
      <Suspense fallback={<LoadingSkeleton />}>
        {/* Pass fetched data to the client component */}
        <CategoryTable
          categories={categories}
          categoryOptions={categoryOptions}
        />
      </Suspense>
    </div>
  );
}
