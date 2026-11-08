import { LoadingSkeleton, Skeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <>
      <div className="bg-midnight pt-32 pb-16"><div className="container-x space-y-4"><Skeleton className="h-3 w-24 opacity-20" /><Skeleton className="h-12 w-80 opacity-20" /></div></div>
      <div className="container-x grid gap-10 py-14 lg:grid-cols-[270px_1fr]">
        <div className="hidden space-y-4 lg:block">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <LoadingSkeleton />
      </div>
    </>
  );
}
