"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { useEffect, useState } from "react";

type T = { id: string; name: string; title: string | null; quote: string; rating: number };

export function Testimonials({ items }: { items: T[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [paused, items.length]);
  if (!items.length) return null;
  const t = items[i];
  return (
    <div className="relative mx-auto max-w-4xl text-center" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <Quote className="mx-auto size-10 text-gold" aria-hidden />
      <div className="relative mt-8 min-h-[220px] sm:min-h-[180px]" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.figure key={t.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <blockquote className="text-xl leading-relaxed font-medium tracking-tight sm:text-2xl">“{t.quote}”</blockquote>
            <figcaption className="mt-7">
              <div className="flex justify-center gap-0.5" aria-label={`${t.rating} out of 5 stars`}>{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={k < t.rating ? "size-4 fill-gold text-gold" : "size-4 text-line"} aria-hidden />)}</div>
              <p className="mt-3 font-semibold">{t.name}</p>
              {t.title && <p className="text-sm text-slate">{t.title}</p>}
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>
      <div className="mt-8 flex items-center justify-center gap-4">
        <button onClick={() => setI((i - 1 + items.length) % items.length)} className="grid size-10 place-items-center border border-line transition hover:border-midnight" aria-label="Previous testimonial"><ChevronLeft className="size-4" /></button>
        <div className="flex gap-2">
          {items.map((x, k) => <button key={x.id} onClick={() => setI(k)} aria-label={`Show testimonial ${k + 1}`} aria-current={k === i} className={`h-1 transition-all duration-500 ${k === i ? "w-8 bg-gold" : "w-3 bg-midnight/15"}`} />)}
        </div>
        <button onClick={() => setI((i + 1) % items.length)} className="grid size-10 place-items-center border border-line transition hover:border-midnight" aria-label="Next testimonial"><ChevronRight className="size-4" /></button>
      </div>
    </div>
  );
}
