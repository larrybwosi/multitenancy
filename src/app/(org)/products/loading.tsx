import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map(
        (
          _,
          i // Show 8 skeletons
        ) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-start space-x-2">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="flex-grow space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-5 w-1/4" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardHeader>
            <CardContent className="py-2 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter className="pt-2">
              <Skeleton className="h-4 w-1/3" />
            </CardFooter>
          </Card>
        )
      )}
    </div>
  );
}
