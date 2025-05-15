import { Skeleton } from '@/components/ui/skeleton';

export function DepartmentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>

      {/* Separator */}
      <Skeleton className="h-[1px] w-full" />

      {/* Search Input Skeleton */}
      <Skeleton className="h-10 w-full" />

      {/* Table Skeleton */}
      <div className="rounded-md border">
        <div className="grid grid-cols-12 gap-4 p-4 border-b">
          <Skeleton className="h-4 col-span-2" />
          <Skeleton className="h-4 col-span-4" />
          <Skeleton className="h-4 col-span-2" />
          <Skeleton className="h-4 col-span-2" />
          <Skeleton className="h-4 col-span-2" />
        </div>

        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-4 p-4 border-b">
            <div className="flex items-center space-x-3 col-span-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
            <div className="col-span-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="col-span-2">
              <Skeleton className="h-6 w-[60px] rounded-full" />
            </div>
            <div className="col-span-2">
              <Skeleton className="h-6 w-[70px] rounded-full" />
            </div>
            <div className="col-span-2 flex justify-end">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
