import { Skeleton } from "@/components/ui/skeleton";

export default function RouteLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-80" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-lg border p-4">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
