import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-[2px]", className)} />;
}

export function VehicleCardSkeleton() {
  return (
    <div className="bg-white">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="grid grid-cols-3 gap-2 pt-2"><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ variant = "grid", count = 6 }: { variant?: "grid" | "table" | "detail"; count?: number }) {
  if (variant === "table")
    return (
      <div role="status" aria-label="Loading" className="space-y-2">
        {Array.from({ length: count }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  if (variant === "detail")
    return (
      <div role="status" aria-label="Loading" className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="aspect-[16/10] w-full" />
        <div className="space-y-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-3/4" /><Skeleton className="h-8 w-1/2" /><Skeleton className="h-40 w-full" /></div>
      </div>
    );
  return (
    <div role="status" aria-label="Loading vehicles" className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => <VehicleCardSkeleton key={i} />)}
    </div>
  );
}
