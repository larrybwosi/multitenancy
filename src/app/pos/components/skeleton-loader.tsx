'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MotionDiv } from '@/components/motion';

export function ProductGridSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border dark:border-neutral-800 shadow-sm overflow-hidden">
      {/* Search Header Skeleton */}
      <div className="p-4 border-b border-border dark:border-neutral-800 sticky top-0 bg-background z-10">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Skeleton className="h-10 w-full pl-10" />
          </div>
          <Skeleton className="h-10 w-[140px]" />
        </div>
      </div>

      {/* Product Grid Area Skeleton */}
      <ScrollArea className="flex-grow">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <MotionDiv
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col space-y-3">
                <Skeleton className="h-[200px] w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                  </div>
                </div>
              </div>
            </MotionDiv>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
