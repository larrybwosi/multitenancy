import { Suspense } from "react";
import { CategoryTable } from "./components/table";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FolderKanban } from "lucide-react";

type SearchParams = Promise<{
  search?: string;
  filter?: string;
  page?: string;
  pageSize?: string;
}>

export const dynamic = 'force-dynamic'
export default async function CategoriesPage(params: {
  searchParams: SearchParams;
}) {
  const searchParams = await params.searchParams;
  // Parse pagination parameters with defaults
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;

  return (
    <div className="px-4 mx-auto py-10">
      <SectionHeader
        title="Categories"
        subtitle="Manage your categories efficiently and effectively"
        icon={<FolderKanban className="h-8 w-8 text-indigo-500" />}
      />

      <Suspense fallback={<div>Loading categories...</div>}>
        <CategoryTable
          currentPage={page}
          pageSize={pageSize}
        />
      </Suspense>
    </div>
  );
}
