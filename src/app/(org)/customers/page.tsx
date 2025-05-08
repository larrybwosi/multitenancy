'use client';
import { use } from "react";
import { CustomerTable } from "./components/CustomerTable";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Users } from "lucide-react";
import { useCustomers } from "@/lib/hooks/use-customers";

function LoadingSkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="h-10 bg-muted rounded animate-pulse w-64"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-muted rounded animate-pulse w-36"></div>
            <div className="h-10 bg-muted rounded animate-pulse w-24"></div>
          </div>
        </div>
        <div className="h-10 bg-muted rounded animate-pulse w-36"></div>
      </div>
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="h-12 w-full bg-muted/50 rounded-t-lg"></div>
        <div className="p-4 space-y-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-12 w-full bg-muted rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

type SearchParams = Promise<{ [key: string]: string | undefined }>;
export default function CustomersPage(props: { searchParams: SearchParams }) {

  const searchParams = use(props.searchParams);

  const { data, isLoading } = useCustomers({
    query: searchParams.query,
    status: searchParams.status as "active" | "inactive" | "all" | undefined,
    sortBy: searchParams.sortBy,
    sortOrder: searchParams.sortOrder as 'asc' | 'desc',
    page: searchParams.page ? parseInt(searchParams.page as string) : 1,
  });
  

  if (!data || isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 lg:px-6">
        <SectionHeader
          title="Customer Management"
          subtitle="Manage your customer data, track loyalty points, and monitor customer status."
          icon={<Users className="h-8 w-8 text-indigo-500" />}
        />
        <LoadingSkeleton />
      </div>
    );
  }
  const { data: { customers, totalCount, totalPages } } = data;

  return (
    <div className="container mx-auto py-6 px-4 lg:px-6">
      <div className="mb-8">
        <SectionHeader
          title="Customer Management"
          subtitle="Manage your customer data, track loyalty points, and monitor customer
          status."
          icon={<Users className="h-8 w-8 text-indigo-500" />}
        />
      </div>

      <div className=" rounded-lg shadow-sm">
        <CustomerTable initialCustomers={customers} total={totalCount} totalPages={totalPages} />
      </div>
    </div>
  );
}
