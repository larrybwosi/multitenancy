export default function LoadingSkeleton() {
  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <div className="h-10 w-36 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="rounded-md border p-4">
        <div className="h-8 w-full bg-gray-200 rounded mb-4 animate-pulse"></div>{" "}
        {/* Header */}
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 w-full bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
