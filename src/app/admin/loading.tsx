import { LoadingSkeleton, Skeleton } from "@/components/ui/LoadingSkeleton";
export default function Loading() {
  return <div className="space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div><LoadingSkeleton variant="table" count={8} /></div>;
}
