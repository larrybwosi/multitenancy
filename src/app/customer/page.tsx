import { getCustomers } from "@/actions/customerActions";
import { Suspense } from "react";
import { CustomerTable } from "./components/CustomerTable";

// Loading Skeleton for Table
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

// Define metadata (optional but good practice)
export const metadata = {
  title: "Customer Management",
  description: "View and manage customer data.",
};

interface CustomersPageProps {
  searchParams: {
    query?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  };
}

export default async function CustomersPage(params: CustomersPageProps) {
  const searchParams = await params.searchParams
  const { customers, total, totalPages } = await getCustomers({
    query: searchParams.query,
    status: searchParams.status,
    sortBy: searchParams.sortBy,
    sortOrder: searchParams.sortOrder as "asc" | "desc",
    page: searchParams.page ? parseInt(searchParams.page) : 1,
  });

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Customer Management
        </h1>
        <p className="text-muted-foreground">
          Manage your customer data, track loyalty points, and monitor customer status.
        </p>
      </div>
      
      <div className="bg-background rounded-lg p-6 shadow-sm border">
        <Suspense fallback={<LoadingSkeleton />}>
          <CustomerTable 
            initialCustomers={customers} 
            total={total}
            totalPages={totalPages}
          />
        </Suspense>
      </div>
    </div>
  );
}
