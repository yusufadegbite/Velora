"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { cn } from "@/lib/utils";

type Img = { id: string; url: string; alt: string };

export function VehicleGallery({ images, name }: { images: Img[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [full, setFull] = useState(false);
  const count = Math.max(images.length, 1);
  const go = useCallback((delta: number) => { setDir(delta); setIndex((i) => (i + delta + count) % count); }, [count]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!full) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Escape") setFull(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = full ? "hidden" : "";
    return () => window.removeEventListener("keydown", onKey);
  }, [full, go]);

  const current = images[index];
  const slide = {
    enter: (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -40 }),
  };
  const navBtn = "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center bg-white/90 text-midnight backdrop-blur transition hover:bg-gold";

  return (
    <div>
      <div className="group relative aspect-[16/10] overflow-hidden bg-midnight">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div key={index} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0"
            drag={images.length > 1 ? "x" : false} dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, info) => { if (info.offset.x < -60) go(1); else if (info.offset.x > 60) go(-1); }}>
            <VehicleImage src={current?.url ?? null} alt={current?.alt ?? name} fill priority sizes="(min-width:1024px) 60vw, 100vw" fallbackLabel={name} />
          </motion.div>
        </AnimatePresence>
        {images.length > 1 && (
          <>
            <button onClick={() => go(-1)} className={cn(navBtn, "left-4 opacity-0 group-hover:opacity-100 focus:opacity-100")} aria-label="Previous image"><ChevronLeft className="size-5" /></button>
            <button onClick={() => go(1)} className={cn(navBtn, "right-4 opacity-0 group-hover:opacity-100 focus:opacity-100")} aria-label="Next image"><ChevronRight className="size-5" /></button>
          </>
        )}
        <button onClick={() => setFull(true)} className="absolute right-4 bottom-4 z-10 flex items-center gap-2 bg-midnight/80 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-gold hover:text-midnight" aria-label="View full screen">
          <Expand className="size-3.5" /> {index + 1} / {count}
        </button>
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" role="tablist" aria-label="Gallery thumbnails">
          {images.map((img, i) => (
            <button key={img.id} role="tab" aria-selected={i === index} aria-label={`Show image ${i + 1}`} onClick={() => { setDir(i > index ? 1 : -1); setIndex(i); }}
              className={cn("relative aspect-[4/3] w-24 shrink-0 overflow-hidden bg-midnight transition sm:w-28", i === index ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory" : "opacity-60 hover:opacity-100")}>
              <VehicleImage src={img.url} alt="" fill sizes="112px" />
            </button>
          ))}
        </div>
      )}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {full && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex flex-col bg-midnight-900" role="dialog" aria-modal="true" aria-label={`${name} gallery`}>
              <div className="flex items-center justify-between p-4 text-white">
                <p className="text-sm font-medium">{name} <span className="text-white/40">· {index + 1} / {count}</span></p>
                <button onClick={() => setFull(false)} className="p-2 text-white/70 hover:text-white" aria-label="Close full-screen gallery" autoFocus><X className="size-6" /></button>
              </div>
              <div className="relative flex-1">
                <AnimatePresence initial={false} custom={dir} mode="popLayout">
                  <motion.div key={index} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.45 }} className="absolute inset-0">
                    <VehicleImage src={current?.url ?? null} alt={current?.alt ?? name} fill sizes="100vw" className="!object-contain" />
                  </motion.div>
                </AnimatePresence>
                {images.length > 1 && (
                  <>
                    <button onClick={() => go(-1)} className={cn(navBtn, "left-4")} aria-label="Previous image"><ChevronLeft className="size-5" /></button>
                    <button onClick={() => go(1)} className={cn(navBtn, "right-4")} aria-label="Next image"><ChevronRight className="size-5" /></button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
