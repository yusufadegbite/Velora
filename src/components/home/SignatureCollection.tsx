"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { formatPrice } from "@/lib/utils";

type Item = { id: string; slug: string; name: string; year: number; trim: string | null; price: number; image: string | null; horsepower: number; brand: { name: string } };

export function SignatureCollection({ items }: { items: Item[] }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => track.current?.scrollBy({ left: d * track.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div>
      <div className="mb-6 flex justify-end gap-2">
        <button onClick={() => scroll(-1)} aria-label="Scroll left" className="grid size-11 place-items-center border border-white/15 text-white transition hover:border-gold hover:text-gold"><ArrowLeft className="size-4" /></button>
        <button onClick={() => scroll(1)} aria-label="Scroll right" className="grid size-11 place-items-center border border-white/15 text-white transition hover:border-gold hover:text-gold"><ArrowRight className="size-4" /></button>
      </div>
      <div ref={track} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {items.map((v, i) => (
          <motion.div key={v.id} initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }} className="w-[85%] shrink-0 snap-start sm:w-[60%] lg:w-[42%]">
            <Link href={`/cars/${v.slug}`} className="group block">
              <div className="relative aspect-[16/10] overflow-hidden bg-midnight-800">
                <VehicleImage src={v.image} alt={`${v.year} ${v.name}`} fill sizes="(min-width:1024px) 42vw, 85vw" className="transition-transform duration-[1.4s] ease-[var(--ease-premium)] group-hover:scale-105" fallbackLabel={v.brand.name} />
                <span className="absolute top-4 left-4 bg-midnight/80 px-3 py-1.5 text-[0.65rem] font-semibold tracking-[0.2em] text-gold uppercase backdrop-blur">{v.horsepower} hp</span>
              </div>
              <div className="mt-5 flex items-start justify-between gap-4 text-white">
                <div>
                  <p className="text-[0.7rem] tracking-[0.2em] text-white/45 uppercase">{v.year} · {v.brand.name}</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight transition-colors group-hover:text-gold">{v.name.replace(`${v.brand.name} `, "")} {v.trim && <span className="font-normal text-white/50">{v.trim}</span>}</h3>
                </div>
                <p className="shrink-0 text-lg font-semibold tabular-nums">{formatPrice(v.price)}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
