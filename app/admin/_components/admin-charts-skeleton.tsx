import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminChartsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-8 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="mt-6">
              <Skeleton className="h-[120px] w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
