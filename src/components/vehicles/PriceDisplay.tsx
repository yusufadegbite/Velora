import { cn, formatPrice } from "@/lib/utils";

export function PriceDisplay({ price, previousPrice, size = "md", suffix, className, dark }: { price: number; previousPrice?: number | null; size?: "sm" | "md" | "lg" | "xl"; suffix?: string; className?: string; dark?: boolean }) {
  const sizes = { sm: "text-base", md: "text-lg", lg: "text-2xl", xl: "text-3xl sm:text-4xl" };
  const saving = previousPrice && previousPrice > price ? previousPrice - price : 0;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2.5 gap-y-1", className)}>
      <span className={cn("font-bold tracking-tight tabular-nums", sizes[size], dark ? "text-white" : "text-midnight")}>
        {formatPrice(price)}
        {suffix && <span className={cn("ml-1 text-[0.6em] font-medium", dark ? "text-white/50" : "text-slate")}>{suffix}</span>}
      </span>
      {saving > 0 && (
        <>
          <span className={cn("text-sm line-through tabular-nums", dark ? "text-white/40" : "text-slate-light")}>{formatPrice(previousPrice!)}</span>
          <span className="text-xs font-semibold text-gold-dark">Save {formatPrice(saving)}</span>
        </>
      )}
    </div>
  );
}
