"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { SearchBar } from "@/components/vehicles/SearchBar";
import { Counter } from "@/components/ui/Counter";

type Props = {
  eyebrow: string; title: string; subtitle: string; image: string | null;
  brands: { name: string; slug: string }[];
  stats: { vehicles: number; brands: number; customers: number };
};

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ eyebrow, title, subtitle, image, brands, stats }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1.15]);
  const words = title.split(" ");

  return (
    <section ref={ref} className="grain relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-midnight text-white">
      <motion.div style={{ y, scale }} className="absolute inset-0 -z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6, ease }}>
        <VehicleImage src={image} alt="" fill priority sizes="100vw" className="opacity-55" bare />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(16,21,28,0.75)_0%,rgba(16,21,28,0.35)_35%,rgba(16,21,28,0.85)_80%,#10151C_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_40%,rgba(16,21,28,0.9),transparent_60%)]" />

      {/* Subtle animated light sweeps */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div className="absolute top-[58%] -left-1/3 h-px w-2/3 bg-gradient-to-r from-transparent via-gold/60 to-transparent" animate={{ x: ["0%", "250%"] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }} />
        <motion.div className="absolute top-[64%] -left-1/3 h-px w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent" animate={{ x: ["0%", "300%"] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3, repeatDelay: 1 }} />
        <motion.div className="absolute -right-40 -bottom-40 size-[36rem] rounded-full bg-gold/10 blur-[140px]" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 8, repeat: Infinity }} />
        <div className="absolute inset-y-0 left-[8%] w-px bg-white/[0.04]" /><div className="absolute inset-y-0 right-[8%] w-px bg-white/[0.04]" />
      </div>

      <div className="container-x flex flex-1 flex-col justify-center pt-32 pb-10">
        <motion.p className="eyebrow flex items-center gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.2 }}>
          <span className="h-px w-10 bg-gold" />{eyebrow}
        </motion.p>
        <h1 className="display mt-6 max-w-4xl text-[2.7rem] sm:text-6xl lg:text-[5.4rem]">
          {words.map((w, i) => (
            <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
              <motion.span className="inline-block" initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 1, ease, delay: 0.3 + i * 0.07 }}>
                {w}&nbsp;
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.8 }}>
          {subtitle}
        </motion.p>
        <motion.div className="mt-9 flex flex-wrap gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.95 }}>
          <LinkButton href="/cars" size="lg">Explore Vehicles <ArrowRight className="size-4" /></LinkButton>
          <LinkButton href="/rentals" variant="outline-light" size="lg">Discover Rentals</LinkButton>
        </motion.div>
      </div>

      <motion.div className="container-x pb-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease, delay: 1.1 }}>
        <SearchBar brands={brands} />
        <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 sm:flex sm:gap-14">
          <div><dt className="text-[0.65rem] tracking-[0.2em] text-white/45 uppercase">Vehicles in stock</dt><dd className="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl"><Counter to={stats.vehicles} /></dd></div>
          <div><dt className="text-[0.65rem] tracking-[0.2em] text-white/45 uppercase">Marques</dt><dd className="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl"><Counter to={stats.brands} /></dd></div>
          <div><dt className="text-[0.65rem] tracking-[0.2em] text-white/45 uppercase">Inspection points</dt><dd className="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl"><Counter to={180} /></dd></div>
          <div className="col-span-3 hidden items-center gap-3 self-end text-sm text-white/60 lg:ml-auto lg:flex"><ShieldCheck className="size-5 text-gold" />Every listing verified · customs, title & service history</div>
        </dl>
      </motion.div>
    </section>
  );
}
