"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X, Loader2, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useOptimistic, useState, useTransition, type ReactNode } from "react";
import { LABELS, cn, formatCompactPrice } from "@/lib/utils";

type Brand = { name: string; slug: string; count: number };
const MULTI = ["brand", "body", "fuel", "transmission", "condition"] as const;

function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const urlParams = useSearchParams();
  const [pending, start] = useTransition();
  // Optimistic copy of the query string so controls respond instantly while the server re-renders.
  const [optimistic, setOptimistic] = useOptimistic(urlParams.toString());
  const params = useMemo(() => new URLSearchParams(optimistic), [optimistic]);
  const update = (mutate: (sp: URLSearchParams) => void) => {
    const sp = new URLSearchParams(params.toString());
    mutate(sp);
    sp.delete("page");
    start(() => {
      setOptimistic(sp.toString());
      router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
    });
  };
  const list = (key: string) => (params.get(key)?.split(",").filter(Boolean) ?? []);
  return { params, update, list, pending, pathname, router, start };
}

function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <fieldset className="border-b border-line py-5">
      <legend className="sr-only">{title}</legend>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between text-left text-xs font-semibold tracking-[0.18em] uppercase">
        {title}<ChevronDown className={cn("size-4 text-slate transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </fieldset>
  );
}

function Chips({ name, options, selected, onToggle }: { name: string; options: [string, string][]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={name}>
      {options.map(([value, text]) => {
        const on = selected.includes(value);
        return (
          <button key={value} type="button" aria-pressed={on} onClick={() => onToggle(value)}
            className={cn("border px-3 py-1.5 text-xs font-medium transition", on ? "border-midnight bg-midnight text-white" : "border-line bg-white text-midnight/80 hover:border-midnight/40")}>
            {text}
          </button>
        );
      })}
    </div>
  );
}

function NumberPair({ minKey, maxKey, placeholder, step, prefix }: { minKey: string; maxKey: string; placeholder: [string, string]; step?: number; prefix?: string }) {
  const { params, update } = useFilterNav();
  const [min, setMin] = useState(params.get(minKey) ?? "");
  const [max, setMax] = useState(params.get(maxKey) ?? "");
  useEffect(() => { setMin(params.get(minKey) ?? ""); setMax(params.get(maxKey) ?? ""); }, [params, minKey, maxKey]);
  const commit = () => update((sp) => {
    min ? sp.set(minKey, min) : sp.delete(minKey);
    max ? sp.set(maxKey, max) : sp.delete(maxKey);
  });
  return (
    <div className="grid grid-cols-2 gap-2" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commit())}>
      <label className="relative">
        <span className="sr-only">{placeholder[0]}</span>
        {prefix && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-slate">{prefix}</span>}
        <input type="number" inputMode="numeric" min={0} step={step} value={min} onChange={(e) => setMin(e.target.value)} onBlur={commit} placeholder={placeholder[0]} className={cn("field py-2 text-sm", prefix && "pl-7")} />
      </label>
      <label className="relative">
        <span className="sr-only">{placeholder[1]}</span>
        {prefix && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-slate">{prefix}</span>}
        <input type="number" inputMode="numeric" min={0} step={step} value={max} onChange={(e) => setMax(e.target.value)} onBlur={commit} placeholder={placeholder[1]} className={cn("field py-2 text-sm", prefix && "pl-7")} />
      </label>
    </div>
  );
}

function FilterPanel({ brands, mode }: { brands: Brand[]; mode: "sale" | "rent" }) {
  const { params, update, list } = useFilterNav();
  const toggle = (key: string, value: string) =>
    update((sp) => {
      const cur = sp.get(key)?.split(",").filter(Boolean) ?? [];
      const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
      next.length ? sp.set(key, next.join(",")) : sp.delete(key);
    });
  const [model, setModel] = useState(params.get("model") ?? "");
  useEffect(() => setModel(params.get("model") ?? ""), [params]);
  const mileageOptions: [string, string][] = [["", "Any"], ["0", "Brand new"], ["10000", "< 10,000 km"], ["30000", "< 30,000 km"], ["60000", "< 60,000 km"]];

  return (
    <div>
      <Section title="Brand">
        <ul className="space-y-1">
          {brands.map((b) => {
            const on = list("brand").includes(b.slug);
            return (
              <li key={b.slug}>
                <label className="flex cursor-pointer items-center gap-3 py-1 text-sm">
                  <input type="checkbox" checked={on} onChange={() => toggle("brand", b.slug)} className="size-4 accent-[#10151C]" />
                  <span className={cn("flex-1", on && "font-semibold")}>{b.name}</span>
                  <span className="text-xs text-slate tabular-nums">{b.count}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </Section>
      <Section title="Model">
        <input value={model} onChange={(e) => setModel(e.target.value)} onBlur={() => update((sp) => (model ? sp.set("model", model) : sp.delete("model")))} onKeyDown={(e) => e.key === "Enter" && update((sp) => (model ? sp.set("model", model) : sp.delete("model")))} placeholder="e.g. Land Cruiser" className="field py-2 text-sm" aria-label="Model" />
      </Section>
      <Section title={mode === "rent" ? "Daily rate (₦)" : "Price (₦)"}>
        <NumberPair minKey="minPrice" maxKey="maxPrice" placeholder={["Min", "Max"]} step={mode === "rent" ? 10000 : 1000000} prefix="₦" />
        {mode === "sale" && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[[0, 50e6], [50e6, 150e6], [150e6, 300e6], [300e6, 0]].map(([a, b]) => (
              <button key={`${a}-${b}`} type="button" onClick={() => update((sp) => { a ? sp.set("minPrice", String(a)) : sp.delete("minPrice"); b ? sp.set("maxPrice", String(b)) : sp.delete("maxPrice"); })} className="border border-line bg-white px-2 py-1 text-[0.7rem] text-slate hover:border-midnight hover:text-midnight">
                {a ? formatCompactPrice(a) : "₦0"}{b ? ` – ${formatCompactPrice(b)}` : "+"}
              </button>
            ))}
          </div>
        )}
      </Section>
      <Section title="Year">
        <NumberPair minKey="minYear" maxKey="maxYear" placeholder={["From", "To"]} />
      </Section>
      <Section title="Body type">
        <Chips name="Body type" options={Object.entries(LABELS.bodyType)} selected={list("body")} onToggle={(v) => toggle("body", v)} />
      </Section>
      <Section title="Fuel type">
        <Chips name="Fuel type" options={Object.entries(LABELS.fuelType)} selected={list("fuel")} onToggle={(v) => toggle("fuel", v)} />
      </Section>
      <Section title="Transmission">
        <Chips name="Transmission" options={Object.entries(LABELS.transmission)} selected={list("transmission")} onToggle={(v) => toggle("transmission", v)} />
      </Section>
      <Section title="Mileage" defaultOpen={false}>
        <Chips name="Mileage" options={mileageOptions.slice(1)} selected={[params.get("maxMileage") ?? ""]} onToggle={(v) => update((sp) => (sp.get("maxMileage") === v ? sp.delete("maxMileage") : sp.set("maxMileage", v)))} />
      </Section>
      <Section title="Engine capacity (L)" defaultOpen={false}>
        <NumberPair minKey="minEngine" maxKey="maxEngine" placeholder={["Min L", "Max L"]} step={0.1} />
        <p className="mt-2 text-xs text-slate">Electric vehicles have no engine capacity and are excluded when set.</p>
      </Section>
      <Section title="Condition" defaultOpen={false}>
        <Chips name="Condition" options={Object.entries(LABELS.condition)} selected={list("condition")} onToggle={(v) => toggle("condition", v)} />
      </Section>
      {mode === "sale" && (
        <Section title="Availability" defaultOpen={false}>
          <Chips name="Availability" options={[["available", "Available now"], ["all", "Include reserved & sold"]]} selected={[params.get("availability") ?? "available"]} onToggle={(v) => update((sp) => (v === "available" ? sp.delete("availability") : sp.set("availability", v)))} />
        </Section>
      )}
    </div>
  );
}

const SORTS: [string, string][] = [
  ["newest", "Newest arrivals"], ["price_asc", "Price: low to high"], ["price_desc", "Price: high to low"],
  ["popular", "Most popular"], ["recent", "Recently updated"], ["year_desc", "Year: newest first"], ["mileage_asc", "Lowest mileage"],
];

export function VehicleFilters({ brands, mode = "sale", total }: { brands: Brand[]; mode?: "sale" | "rent"; total: number }) {
  const { params, update, pending, pathname, router, start } = useFilterNav();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => { document.body.style.overflow = drawer ? "hidden" : ""; }, [drawer]);

  const chips = useMemo(() => {
    const out: { key: string; value?: string; text: string }[] = [];
    const brandName = (s: string) => brands.find((b) => b.slug === s)?.name ?? s;
    const labelFor: Record<string, (v: string) => string> = {
      brand: brandName,
      body: (v) => LABELS.bodyType[v as keyof typeof LABELS.bodyType] ?? v,
      fuel: (v) => LABELS.fuelType[v as keyof typeof LABELS.fuelType] ?? v,
      transmission: (v) => LABELS.transmission[v as keyof typeof LABELS.transmission] ?? v,
      condition: (v) => LABELS.condition[v as keyof typeof LABELS.condition] ?? v,
    };
    for (const key of MULTI) for (const v of params.get(key)?.split(",").filter(Boolean) ?? []) out.push({ key, value: v, text: labelFor[key](v) });
    const q = params.get("q"); if (q) out.push({ key: "q", text: `“${q}”` });
    const m = params.get("model"); if (m) out.push({ key: "model", text: `Model: ${m}` });
    const minP = params.get("minPrice"), maxP = params.get("maxPrice");
    if (minP || maxP) out.push({ key: "price", text: `${minP ? formatCompactPrice(+minP) : "₦0"} – ${maxP ? formatCompactPrice(+maxP) : "any"}` });
    const minY = params.get("minYear"), maxY = params.get("maxYear");
    if (minY || maxY) out.push({ key: "year", text: `Year ${minY ?? "…"}–${maxY ?? "…"}` });
    const mm = params.get("maxMileage"); if (mm) out.push({ key: "maxMileage", text: mm === "0" ? "Brand new" : `< ${(+mm).toLocaleString()} km` });
    const minE = params.get("minEngine"), maxE = params.get("maxEngine");
    if (minE || maxE) out.push({ key: "engine", text: `${minE ?? 0}L – ${maxE ?? "any"}L` });
    if (params.get("availability") === "all") out.push({ key: "availability", text: "Incl. reserved & sold" });
    return out;
  }, [params, brands]);

  const removeChip = (c: (typeof chips)[number]) => update((sp) => {
    if (c.key === "price") { sp.delete("minPrice"); sp.delete("maxPrice"); return; }
    if (c.key === "year") { sp.delete("minYear"); sp.delete("maxYear"); return; }
    if (c.key === "engine") { sp.delete("minEngine"); sp.delete("maxEngine"); return; }
    if (c.value) {
      const next = (sp.get(c.key)?.split(",") ?? []).filter((x) => x !== c.value);
      next.length ? sp.set(c.key, next.join(",")) : sp.delete(c.key);
    } else sp.delete(c.key);
  });
  const clearAll = () => start(() => router.replace(pathname, { scroll: false }));

  return (
    <>
      <aside className="hidden lg:row-span-2 lg:block" aria-label="Filters">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-3 pb-10">
          <div className="flex items-center justify-between border-b border-midnight pb-4">
            <h2 className="text-sm font-semibold tracking-wide">Refine results</h2>
            {chips.length > 0 && <button onClick={clearAll} className="text-xs text-slate underline-offset-4 hover:text-midnight hover:underline">Clear all</button>}
          </div>
          <FilterPanel brands={brands} mode={mode} />
        </div>
      </aside>

      <div className="lg:col-start-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-slate" aria-live="polite">
            {pending && <Loader2 className="size-4 animate-spin text-gold" aria-hidden />}
            <span><strong className="font-semibold text-midnight">{total}</strong> {total === 1 ? "vehicle" : "vehicles"} found</span>
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawer(true)} className="flex h-10 items-center gap-2 border border-line bg-white px-4 text-sm font-medium lg:hidden">
              <SlidersHorizontal className="size-4" /> Filters {chips.length > 0 && <span className="grid size-5 place-items-center rounded-full bg-gold text-[0.65rem] font-bold">{chips.length}</span>}
            </button>
            <label className="sr-only" htmlFor="sort">Sort by</label>
            <select id="sort" value={params.get("sort") ?? "newest"} onChange={(e) => update((sp) => (e.target.value === "newest" ? sp.delete("sort") : sp.set("sort", e.target.value)))} className="field h-10 w-auto py-0 pr-8 text-sm">
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {chips.length > 0 && (
            <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
              {chips.map((c) => (
                <motion.li key={`${c.key}-${c.value ?? ""}`} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <button onClick={() => removeChip(c)} className="flex items-center gap-1.5 bg-midnight px-3 py-1.5 text-xs font-medium text-white transition hover:bg-midnight-700" aria-label={`Remove filter ${c.text}`}>
                    {c.text}<X className="size-3 text-gold" />
                  </button>
                </motion.li>
              ))}
              <li><button onClick={clearAll} className="px-2 py-1.5 text-xs text-slate underline-offset-4 hover:underline">Clear all</button></li>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <motion.div className="absolute inset-0 bg-midnight/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 280 }} className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-ivory">
              <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
                <h2 className="font-semibold">Filters</h2>
                <button onClick={() => setDrawer(false)} aria-label="Close filters" className="p-1"><X className="size-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5"><FilterPanel brands={brands} mode={mode} /></div>
              <div className="grid grid-cols-2 gap-3 border-t border-line bg-white p-4">
                <button onClick={clearAll} className="h-11 border border-line text-sm font-semibold">Clear</button>
                <button onClick={() => setDrawer(false)} className="h-11 bg-midnight text-sm font-semibold text-white">{pending ? "Updating…" : `Show ${total} results`}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
