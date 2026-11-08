import Link from "next/link";
import { Gauge, Fuel, Cog, ArrowUpRight } from "lucide-react";
import type { VehicleCardData } from "@/lib/data/vehicles";
import { formatMileage, label, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { PriceDisplay } from "./PriceDisplay";
import { WishlistButton } from "./WishlistButton";
import { CompareToggle } from "./CompareToggle";

export function VehicleCard({ vehicle: v, saved = false, mode = "sale", priority = false }: { vehicle: VehicleCardData; saved?: boolean; mode?: "sale" | "rent"; priority?: boolean }) {
  const href = mode === "rent" ? `/rentals/${v.slug}` : `/cars/${v.slug}`;
  const specs = [
    { Icon: Gauge, text: formatMileage(v.mileage), label: "Mileage" },
    { Icon: Cog, text: label("transmission", v.transmission), label: "Transmission" },
    { Icon: Fuel, text: label("fuelType", v.fuelType), label: "Fuel" },
  ];
  return (
    <article className="group relative flex h-full flex-col bg-white transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgba(16,21,28,0.35)]">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-midnight" aria-label={`${v.year} ${v.name}${v.trim ? ` ${v.trim}` : ""}`}>
        <VehicleImage src={v.image} alt={v.imageAlt} fill priority={priority} sizes="(min-width:1280px) 30vw, (min-width:640px) 45vw, 100vw" className="transition-transform duration-[1.2s] ease-[var(--ease-premium)] group-hover:scale-[1.06]" fallbackLabel={v.brand.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/50 via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge tone="glass">{label("condition", v.condition)}</Badge>
          {v.previousPrice && v.previousPrice > v.price && <Badge tone="gold" className="bg-gold text-midnight">Offer</Badge>}
          {v.status !== "AVAILABLE" && <Badge tone="dark">{label("vehicleStatus", v.status)}</Badge>}
        </div>
        <span className="absolute right-3 bottom-3 grid size-9 translate-y-2 place-items-center bg-gold text-midnight opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" aria-hidden>
          <ArrowUpRight className="size-4" />
        </span>
      </Link>
      <WishlistButton vehicleId={v.id} saved={saved} className="absolute top-3 right-3" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-[0.7rem] font-semibold tracking-[0.16em] text-slate uppercase">
          <span>{v.brand.name}</span>
          <span>{v.year}</span>
        </div>
        <h3 className="mt-1.5 text-lg leading-snug font-semibold tracking-tight">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {v.model} {v.trim && <span className="font-normal text-slate">{v.trim}</span>}
          </Link>
        </h3>
        <div className="mt-3">
          {mode === "rent" && v.dailyRate ? <PriceDisplay price={v.dailyRate} suffix="/ day" size="md" /> : <PriceDisplay price={v.price} previousPrice={v.previousPrice} size="md" />}
          {mode === "rent" && v.weeklyRate && <p className="mt-0.5 text-xs text-slate">{formatPrice(v.weeklyRate)} / week</p>}
        </div>
        <ul className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
          {specs.map(({ Icon, text, label: l }) => (
            <li key={l} className="flex min-w-0 flex-col gap-1">
              <Icon className="size-3.5 text-gold" aria-hidden />
              <span className="sr-only">{l}:</span>
              <span className="truncate text-xs font-medium text-midnight/80">{text}</span>
            </li>
          ))}
        </ul>
        <div className="relative z-10 mt-auto flex items-center justify-between pt-4">
          <CompareToggle entry={{ id: v.id, name: `${v.brand.name} ${v.model}`, image: v.image, year: v.year }} />
          <Link href={href} className="text-xs font-semibold tracking-wide text-midnight underline-offset-4 hover:text-gold-dark hover:underline">
            {mode === "rent" ? "Book now" : "View details"}
          </Link>
        </div>
      </div>
    </article>
  );
}
