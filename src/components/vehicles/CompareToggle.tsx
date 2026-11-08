"use client";
import { GitCompareArrows, Check } from "lucide-react";
import { useCompare, type CompareEntry } from "@/components/compare/CompareProvider";
import { cn } from "@/lib/utils";

export function CompareToggle({ entry, variant = "chip", className }: { entry: CompareEntry; variant?: "chip" | "full"; className?: string }) {
  const { has, toggle } = useCompare();
  const active = has(entry.id);
  const onClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); toggle(entry); };
  if (variant === "full")
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={cn("inline-flex h-11 items-center justify-center gap-2 border px-5 text-sm font-semibold transition", active ? "border-midnight bg-midnight text-white" : "border-midnight/20 hover:border-midnight", className)}>
        {active ? <Check className="size-4" /> : <GitCompareArrows className="size-4" />}
        {active ? "In comparison" : "Compare Vehicle"}
      </button>
    );
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn("inline-flex items-center gap-1.5 text-xs font-semibold transition", active ? "text-gold-dark" : "text-slate hover:text-midnight", className)}>
      {active ? <Check className="size-3.5" /> : <GitCompareArrows className="size-3.5" />}
      {active ? "Comparing" : "Compare"}
    </button>
  );
}
