import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, Icon, hint, href, dark }: { label: string; value: string | number; Icon: LucideIcon; hint?: string; href?: string; dark?: boolean }) {
  const body = (
    <div className={cn("group flex h-full flex-col justify-between border p-5 transition", dark ? "border-midnight bg-midnight text-white" : "border-line bg-white hover:border-midnight/30")}>
      <div className="flex items-center justify-between">
        <p className={cn("text-[0.7rem] font-semibold tracking-[0.16em] uppercase", dark ? "text-white/50" : "text-slate")}>{label}</p>
        <Icon className="size-4 text-gold" aria-hidden />
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className={cn("mt-1 text-xs", dark ? "text-white/45" : "text-slate")}>{hint}</p>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}
