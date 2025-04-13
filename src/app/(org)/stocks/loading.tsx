import { Skeleton } from "@/components/ui/skeleton";

// --- Skeleton Loader Component with improved animations ---
export default function StocksPageSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center mb-8 space-x-4">
        <Skeleton className="h-12 w-12 rounded-lg" /> {/* Icon */}
        <Skeleton className="h-10 w-1/3" /> {/* Title */}
      </div>

      {/* Improved skeleton for tabs */}
      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-2 mb-8">
        <Skeleton className="h-12 w-full grid grid-cols-3 gap-2" />
      </div>

      {/* Enhanced skeleton for a tab content card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <Skeleton className="h-7 w-1/4 mb-3" /> {/* Card Title */}
          <Skeleton className="h-5 w-2/5" /> {/* Card Description */}
        </div>
        <div className="p-6 space-y-6">
          {/* Enhanced skeleton for filters/buttons */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>

          {/* Skeleton for data visualization */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-36 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
          </div>

          {/* Enhanced skeleton for table */}
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-lg" /> {/* Table header */}
            {[1, 2, 3, 4].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>

          {/* Enhanced skeleton for pagination */}
          <div className="flex items-center justify-between pt-4">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
