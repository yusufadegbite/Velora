"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Branded fallback shown when a photo is missing or fails to load. */
export function CarFallback({ className, label, bare }: { className?: string; label?: string; bare?: boolean }) {
  return (
    <div className={cn("absolute inset-0 grid place-items-center overflow-hidden bg-gradient-to-br from-midnight-700 via-midnight to-midnight-900", className)}>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(196,154,90,0.22),transparent_70%)]" />
      {!bare && <svg viewBox="0 0 240 90" className="relative w-3/5 max-w-72 text-white/20" aria-hidden>
        <path fill="currentColor" d="M18 62c-6 0-10-4-10-9v-6c0-4 3-7 7-8l38-8c10-9 26-19 52-20 30-1 50 6 72 20l30 4c10 2 18 8 19 16v4c0 4-3 7-7 7h-12a19 19 0 0 0-37 0H74a19 19 0 0 0-37 0zm38-28h50l2-18c-22 1-38 8-52 18zm60 0h46c-12-10-26-16-44-18z" />
        <circle cx="55" cy="64" r="14" fill="currentColor" /><circle cx="186" cy="64" r="14" fill="currentColor" />
      </svg>}
      {label && <span className="absolute bottom-4 left-4 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white/40">{label}</span>}
    </div>
  );
}

export function VehicleImage({ src, alt, className, fallbackLabel, bare, ...props }: Omit<ImageProps, "src"> & { src: string | null; fallbackLabel?: string; bare?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <CarFallback label={fallbackLabel} bare={bare} />;
  return <Image src={src} alt={alt} className={cn("object-cover", className)} onError={() => setFailed(true)} {...props} />;
}
