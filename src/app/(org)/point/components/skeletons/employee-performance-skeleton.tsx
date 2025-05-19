import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function EmployeePerformanceSkeleton() {
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Title and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Main Tabs */}
      <Skeleton className="h-10 w-full mb-6" />

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-4">
              <Skeleton className="h-20 w-20 rounded-full mb-2" />
              <Skeleton className="h-6 w-40 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-4">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="grid grid-cols-[20px_1fr] gap-x-2 items-center">
                    <Skeleton className="h-4 w-4" />
                    <div>
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-40 mx-auto mb-4" />
              <Skeleton className="h-[150px] w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-8 w-40 mb-4" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="space-y-4">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
