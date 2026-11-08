import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { VehicleImage } from "@/components/ui/VehicleImage";

type Promo = { id: string; title: string; description: string; badge: string | null; imageUrl: string; ctaLabel: string | null; ctaHref: string | null };

export function Offers({ promos }: { promos: Promo[] }) {
  if (!promos.length) return null;
  const [first, ...rest] = promos;
  const Card = ({ p, big }: { p: Promo; big?: boolean }) => (
    <Link href={p.ctaHref ?? "/cars"} className={`group relative flex h-full flex-col justify-end overflow-hidden bg-midnight p-6 text-white sm:p-8 ${big ? "min-h-[420px]" : "min-h-[260px]"}`}>
      <VehicleImage src={p.imageUrl} alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="opacity-60 transition-transform duration-[1.4s] ease-[var(--ease-premium)] group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
      <div className="relative">
        {p.badge && <span className="inline-block bg-gold px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.15em] text-midnight uppercase">{p.badge}</span>}
        <h3 className={`mt-4 font-semibold tracking-tight ${big ? "text-3xl" : "text-xl"}`}>{p.title}</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/65">{p.description}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold">{p.ctaLabel ?? "Learn more"}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
  return (
    <Stagger className="grid gap-5 lg:grid-cols-2">
      <StaggerItem className="h-full"><Card p={first} big /></StaggerItem>
      <div className="grid gap-5">{rest.slice(0, 2).map((p) => <StaggerItem key={p.id} className="h-full"><Card p={p} /></StaggerItem>)}</div>
    </Stagger>
  );
}
