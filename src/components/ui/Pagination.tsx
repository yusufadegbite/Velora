import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ page, pages, basePath, params }: { page: number; pages: number; basePath: string; params: Record<string, string | string[] | undefined> }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === "page" || v === undefined || v === "") continue;
      sp.set(k, Array.isArray(v) ? v.join(",") : v);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };
  const windowPages = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);
  const cell = "grid h-10 min-w-10 place-items-center px-3 text-sm font-semibold transition";
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1">
      {page > 1 ? <Link href={href(page - 1)} className={cn(cell, "hover:bg-midnight/5")} aria-label="Previous page"><ChevronLeft className="size-4" /></Link> : <span className={cn(cell, "opacity-30")}><ChevronLeft className="size-4" /></span>}
      {windowPages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && windowPages[i - 1] !== p - 1 && <span className="px-1 text-slate">…</span>}
          <Link href={href(p)} aria-current={p === page ? "page" : undefined} className={cn(cell, p === page ? "bg-midnight text-white" : "hover:bg-midnight/5")}>{p}</Link>
        </span>
      ))}
      {page < pages ? <Link href={href(page + 1)} className={cn(cell, "hover:bg-midnight/5")} aria-label="Next page"><ChevronRight className="size-4" /></Link> : <span className={cn(cell, "opacity-30")}><ChevronRight className="size-4" /></span>}
    </nav>
  );
}
