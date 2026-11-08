import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";

export function BrandGrid({ brands }: { brands: { name: string; slug: string; country: string | null; _count: { vehicles: number } }[] }) {
  return (
    <Stagger className="grid grid-cols-2 border-t border-l border-white/10 sm:grid-cols-3 lg:grid-cols-5" stagger={0.05}>
      {brands.map((b) => (
        <StaggerItem key={b.slug}>
          <Link href={`/brands/${b.slug}`} className="group relative flex aspect-[4/3] flex-col justify-between overflow-hidden border-r border-b border-white/10 p-5 transition-colors duration-500 hover:bg-white/[0.04] sm:p-6">
            <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
            <div className="flex items-start justify-between text-[0.65rem] tracking-[0.2em] text-white/40 uppercase">
              <span>{b.country}</span>
              <ArrowUpRight className="size-4 text-gold opacity-0 transition-all duration-500 group-hover:opacity-100" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-white transition-colors group-hover:text-gold sm:text-xl">{b.name}</h3>
              <p className="mt-1 text-xs text-white/45">{b._count.vehicles} {b._count.vehicles === 1 ? "vehicle" : "vehicles"} available</p>
            </div>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
