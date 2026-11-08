import { LoadingSkeleton, Skeleton } from "@/components/ui/LoadingSkeleton";
export default function Loading() {
  return <div className="space-y-6"><Skeleton className="h-10 w-64" /><LoadingSkeleton variant="table" count={6} /></div>;
}
