"use client";
import Link from "next/link";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { GitCompareArrows, X } from "lucide-react";
import { useCompare } from "./CompareProvider";
import { buttonClass } from "@/components/ui/Button";

export function CompareBar() {
  const { items, remove, clear, max } = useCompare();
  const pathname = usePathname();
  const hidden = pathname.startsWith("/compare") || pathname.startsWith("/admin") || pathname.startsWith("/checkout");
  return (
    <AnimatePresence>
      {items.length > 0 && !hidden && (
        <motion.aside
          aria-label="Vehicle comparison tray"
          initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }} transition={{ type: "spring", damping: 26, stiffness: 260 }}
          className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-4xl border border-white/10 bg-midnight/95 p-3 text-white shadow-2xl backdrop-blur sm:inset-x-6 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <GitCompareArrows className="hidden size-5 shrink-0 text-gold sm:block" aria-hidden />
            <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
              {items.map((i) => (
                <div key={i.id} className="flex shrink-0 items-center gap-2 bg-white/5 py-1 pr-1 pl-1">
                  <div className="relative h-8 w-12 overflow-hidden bg-midnight-700">
                    <VehicleImage src={i.image} alt="" fill sizes="48px" bare />
                  </div>
                  <span className="max-w-32 truncate text-xs font-medium">{i.name}</span>
                  <button onClick={() => remove(i.id)} aria-label={`Remove ${i.name} from comparison`} className="p-1 text-white/50 hover:text-white"><X className="size-3.5" /></button>
                </div>
              ))}
              {Array.from({ length: max - items.length }).map((_, k) => (
                <div key={k} className="hidden h-10 w-28 shrink-0 border border-dashed border-white/15 md:block" aria-hidden />
              ))}
            </div>
            <button onClick={clear} className="hidden text-xs text-white/50 hover:text-white sm:block">Clear</button>
            <Link
              href={`/compare?ids=${items.map((i) => i.id).join(",")}`}
              aria-disabled={items.length < 2}
              className={buttonClass("primary", "sm", items.length < 2 ? "pointer-events-none opacity-50" : "")}
            >
              Compare {items.length}/{max}
            </Link>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
