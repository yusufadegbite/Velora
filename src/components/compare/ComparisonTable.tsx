"use client";
import Link from "next/link";
import { X, Trophy } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ComparisonVehicle } from "@/lib/data/vehicles";
import { cn, formatMileage, formatPrice, label } from "@/lib/utils";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { useCompare } from "./CompareProvider";

type Row = { label: string; get: (v: ComparisonVehicle) => string; best?: (vs: ComparisonVehicle[]) => string | null };

const pick = (vs: ComparisonVehicle[], f: (v: ComparisonVehicle) => number | null, dir: "min" | "max") => {
  const vals = vs.map((v) => ({ id: v.id, n: f(v) })).filter((x): x is { id: string; n: number } => x.n != null);
  if (vals.length < 2) return null;
  const target = dir === "min" ? Math.min(...vals.map((x) => x.n)) : Math.max(...vals.map((x) => x.n));
  const winners = vals.filter((x) => x.n === target);
  return winners.length === 1 ? winners[0].id : null;
};

const ROWS: { section: string; rows: Row[] }[] = [
  { section: "Price & value", rows: [
    { label: "Price", get: (v) => formatPrice(v.price), best: (vs) => pick(vs, (v) => v.price, "min") },
    { label: "Daily rental", get: (v) => (v.forRent && v.dailyRate ? formatPrice(v.dailyRate) : "—") },
    { label: "Condition", get: (v) => label("condition", v.condition) },
    { label: "Availability", get: (v) => label("vehicleStatus", v.status) },
  ] },
  { section: "Overview", rows: [
    { label: "Brand", get: (v) => v.brand.name },
    { label: "Model", get: (v) => `${v.model}${v.trim ? ` ${v.trim}` : ""}` },
    { label: "Year", get: (v) => String(v.year), best: (vs) => pick(vs, (v) => v.year, "max") },
    { label: "Mileage", get: (v) => formatMileage(v.mileage), best: (vs) => pick(vs, (v) => v.mileage, "min") },
    { label: "Body type", get: (v) => label("bodyType", v.bodyType) },
    { label: "Seats", get: (v) => String(v.seats) },
    { label: "Exterior", get: (v) => v.exteriorColor },
    { label: "Interior", get: (v) => v.interiorColor },
  ] },
  { section: "Performance", rows: [
    { label: "Engine", get: (v) => v.engine },
    { label: "Engine capacity", get: (v) => (v.engineCapacity ? `${v.engineCapacity.toFixed(1)} L` : "Electric") },
    { label: "Horsepower", get: (v) => `${v.horsepower} hp`, best: (vs) => pick(vs, (v) => v.horsepower, "max") },
    { label: "Torque", get: (v) => v.specs["Torque"] ?? "—" },
    { label: "0–100 km/h", get: (v) => v.specs["0–100 km/h"] ?? "—", best: (vs) => pick(vs, (v) => parseFloat(v.specs["0–100 km/h"] ?? "") || null, "min") },
    { label: "Top speed", get: (v) => v.specs["Top speed"] ?? "—" },
    { label: "Transmission", get: (v) => label("transmission", v.transmission) },
    { label: "Drivetrain", get: (v) => label("drivetrain", v.drivetrain) },
    { label: "Fuel type", get: (v) => label("fuelType", v.fuelType) },
    { label: "Economy / range", get: (v) => v.specs["Fuel economy"] ?? v.specs["Range"] ?? "—" },
  ] },
];

export function ComparisonTable({ vehicles }: { vehicles: ComparisonVehicle[] }) {
  const { remove } = useCompare();
  const router = useRouter();
  const [diffOnly, setDiffOnly] = useState(false);
  const drop = (id: string) => {
    remove(id);
    const ids = vehicles.map((v) => v.id).filter((x) => x !== id);
    router.replace(ids.length ? `/compare?ids=${ids.join(",")}` : "/compare");
  };
  const cols = `minmax(140px,180px) repeat(${vehicles.length}, minmax(200px, 1fr))`;
  return (
    <div>
      <label className="mb-5 inline-flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} className="size-4 accent-[#10151C]" />
        Highlight differences only
      </label>
      <div className="overflow-x-auto border border-line bg-white">
        <div role="table" aria-label="Vehicle comparison" className="min-w-max">
          <div role="row" className="sticky top-0 grid border-b border-line bg-white" style={{ gridTemplateColumns: cols }}>
            <div role="columnheader" className="p-4 text-xs font-semibold tracking-[0.18em] text-slate uppercase">{vehicles.length} vehicles</div>
            {vehicles.map((v) => (
              <div role="columnheader" key={v.id} className="relative border-l border-line p-4">
                <button onClick={() => drop(v.id)} aria-label={`Remove ${v.name}`} className="absolute top-3 right-3 z-10 grid size-7 place-items-center rounded-full bg-white/90 text-slate shadow hover:text-midnight"><X className="size-3.5" /></button>
                <Link href={`/cars/${v.slug}`} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-midnight"><VehicleImage src={v.image} alt={v.name} fill sizes="260px" className="transition-transform duration-700 group-hover:scale-105" /></div>
                  <p className="mt-3 text-[0.65rem] tracking-[0.15em] text-slate uppercase">{v.year} · {v.brand.name}</p>
                  <p className="font-semibold group-hover:text-gold-dark">{v.model}</p>
                </Link>
              </div>
            ))}
          </div>
          {ROWS.map((s) => (
            <div key={s.section} role="rowgroup">
              <div role="row" className="bg-ivory px-4 py-2.5 text-xs font-semibold tracking-[0.18em] text-midnight uppercase">{s.section}</div>
              {s.rows.map((r) => {
                const values = vehicles.map(r.get);
                const same = values.every((x) => x === values[0]);
                const best = r.best?.(vehicles);
                return (
                  <div role="row" key={r.label} className={cn("grid border-t border-line text-sm transition-opacity", diffOnly && same && "opacity-30")} style={{ gridTemplateColumns: cols }}>
                    <div role="rowheader" className="p-4 text-slate">{r.label}</div>
                    {vehicles.map((v, i) => (
                      <div role="cell" key={v.id} className={cn("border-l border-line p-4 font-medium", best === v.id && "bg-gold/8")}>
                        <span className="flex items-center gap-2">{values[i]}{best === v.id && <Trophy className="size-3.5 text-gold" aria-label="Best in comparison" />}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
