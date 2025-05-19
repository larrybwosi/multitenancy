import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function PointOfSaleSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-64 border-r">
        <Skeleton className="h-full" />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[1fr_350px] h-full">
          <div className="p-6 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-8 w-24" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Skeleton className="h-6 w-24 mb-2" />
                        <Skeleton className="h-4 w-16" />
                      </div>

                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-24 mb-2" />

                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-10 w-[200px]" />
              </div>

              <Skeleton className="h-10 w-full mb-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-0">
                        <Skeleton className="h-[200px] w-full rounded-t-lg" />
                        <div className="p-4">
                          <Skeleton className="h-5 w-32 mb-1" />
                          <Skeleton className="h-4 w-24 mb-2" />

                          <div className="flex gap-2 mb-3">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-20" />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-8 w-8" />
                              <Skeleton className="h-6 w-8" />
                              <Skeleton className="h-8 w-8" />
                            </div>
                            <Skeleton className="h-8 w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>

          <div className="border-l">
            <Skeleton className="h-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
