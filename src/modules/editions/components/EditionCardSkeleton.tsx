import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";

export function EditionCardSkeleton() {
  return (
    <Card className="flex h-full w-full flex-col gap-3 overflow-hidden">
      <Skeleton className="aspect-[2/3] w-full rounded-b-none" />
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-5 w-1/4" />
      <div className="mt-auto pt-3 space-y-2">
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </Card>
  );
}
