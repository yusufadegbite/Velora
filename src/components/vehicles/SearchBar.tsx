"use client";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";
import { LABELS } from "@/lib/utils";

const PRICE_RANGES = [
  { v: "", l: "Any price" },
  { v: "0-50000000", l: "Under ₦50M" },
  { v: "50000000-150000000", l: "₦50M – ₦150M" },
  { v: "150000000-300000000", l: "₦150M – ₦300M" },
  { v: "300000000-", l: "₦300M and above" },
];

export function SearchBar({ brands }: { brands: { name: string; slug: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState({ brand: "", body: "", price: "", transmission: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (f.brand) sp.set("brand", f.brand);
    if (f.body) sp.set("body", f.body);
    if (f.transmission) sp.set("transmission", f.transmission);
    if (f.price) {
      const [min, max] = f.price.split("-");
      if (min) sp.set("minPrice", min);
      if (max) sp.set("maxPrice", max);
    }
    router.push(`/cars${sp.size ? `?${sp}` : ""}`);
  };
  const sel = "w-full appearance-none bg-transparent pt-1 text-[0.95rem] font-medium text-white focus:outline-none [&>option]:text-midnight cursor-pointer";
  const cell = "group relative flex flex-col justify-center px-5 py-3.5 transition-colors hover:bg-white/[0.04] focus-within:bg-white/[0.06]";
  const lbl = "text-[0.65rem] font-semibold tracking-[0.2em] text-white/45 uppercase group-focus-within:text-gold";
  return (
    <form onSubmit={submit} role="search" aria-label="Find a vehicle" className="grid border border-white/12 bg-midnight/70 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-[repeat(4,1fr)_auto]">
      <label className={`${cell} border-b border-white/10 lg:border-r lg:border-b-0 sm:border-r`}>
        <span className={lbl}>Brand</span>
        <select className={sel} value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })}>
          <option value="">All brands</option>
          {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
        </select>
      </label>
      <label className={`${cell} border-b border-white/10 lg:border-r lg:border-b-0`}>
        <span className={lbl}>Vehicle type</span>
        <select className={sel} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })}>
          <option value="">All types</option>
          {Object.entries(LABELS.bodyType).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label className={`${cell} border-b border-white/10 sm:border-r lg:border-b-0`}>
        <span className={lbl}>Price range</span>
        <select className={sel} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })}>
          {PRICE_RANGES.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
        </select>
      </label>
      <label className={`${cell} border-b border-white/10 lg:border-r lg:border-b-0`}>
        <span className={lbl}>Transmission</span>
        <select className={sel} value={f.transmission} onChange={(e) => setF({ ...f, transmission: e.target.value })}>
          <option value="">Any</option>
          <option value="AUTOMATIC">Automatic</option>
          <option value="MANUAL">Manual</option>
        </select>
      </label>
      <button type="submit" className="flex items-center justify-center gap-2 bg-gold px-8 py-4 text-sm font-semibold text-midnight transition hover:bg-gold-light sm:col-span-2 lg:col-span-1">
        <Search className="size-4" /> Search
      </button>
    </form>
  );
}
