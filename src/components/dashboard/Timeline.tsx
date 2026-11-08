import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Timeline({ steps, current, cancelled }: { steps: string[]; current: number; cancelled?: boolean }) {
  return (
    <ol className="flex flex-col gap-4 sm:flex-row sm:gap-0" aria-label="Progress">
      {steps.map((s, i) => {
        const done = !cancelled && i < current, now = !cancelled && i === current;
        return (
          <li key={s} className="flex items-center gap-3 sm:flex-1 sm:flex-col sm:items-start sm:gap-2">
            <div className="flex w-full items-center">
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold", done ? "border-midnight bg-midnight text-gold" : now ? "border-gold bg-gold text-midnight" : "border-line bg-white text-slate")} aria-current={now ? "step" : undefined}>
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              {i < steps.length - 1 && <span className={cn("mx-2 hidden h-px flex-1 sm:block", done ? "bg-midnight" : "bg-line")} />}
            </div>
            <span className={cn("text-xs font-semibold", now ? "text-midnight" : "text-slate")}>{s}</span>
          </li>
        );
      })}
    </ol>
  );
}
