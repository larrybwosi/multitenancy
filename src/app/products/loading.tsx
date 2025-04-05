import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search/Filter Skeleton */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-24" />
            </div>
            {/* Table Skeleton */}
            <div className="rounded-md border">
              <div className="w-full">
                {/* Header row */}
                <div className="flex border-b">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-12 flex-1 m-1" />
                  ))}
                </div>
                {/* Data rows skeleton */}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex border-b">
                    {[...Array(6)].map((_, j) => (
                      <Skeleton key={j} className="h-14 flex-1 m-1" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {/* Pagination Skeleton */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-24" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
