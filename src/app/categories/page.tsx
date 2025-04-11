import { Suspense } from "react";
import { CategoryTable } from "./components/table";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Group } from "lucide-react";
import {
  getCategoriesWithStats,
  getCategoryOptions,
} from "@/actions/category.actions";

type SearchParams = Promise<{
  search?: string;
  filter?: string;
  page?: string;
  pageSize?: string;
}>

export default async function CategoriesPage(params: {
  searchParams: SearchParams;
}) {
  const searchParams = await params.searchParams;
  // Parse pagination parameters with defaults
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;

  // Fetch data in parallel
  const [categoriesData, categoryOptionsData] = await Promise.allSettled([
    getCategoriesWithStats({
      search: searchParams.search,
      filter: searchParams.filter,
      page,
      pageSize,
    }),
    getCategoryOptions(),
  ]);

  // Handle potential errors during data fetching
  if (categoriesData.status === "rejected") {
    console.error("Failed to load categories:", categoriesData.reason);
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
    return (
      <div className="text-red-500 p-4">
        Error loading category options. Please try again later.
      </div>
    );
  }

  const { data: categories, totalItems, totalPages } = categoriesData.value;
  const categoryOptions = categoryOptionsData.value;

  return (
    <div className="container mx-auto py-10">
      <SectionHeader
        title="Categories"
        subtitle="Manage your categories efficiently and effectively"
        icon={<Group className="h-5 w-5" />}
        autoUpdate="2 min"
      />

      <Suspense fallback={<div>Loading categories...</div>}>
        <CategoryTable
          categories={categories}
          categoryOptions={categoryOptions}
          totalItems={totalItems}
          totalPages={totalPages}
          currentPage={page}
          pageSize={pageSize}
        />
      </Suspense>
    </div>
  );
}
