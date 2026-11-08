import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <path d="M3 6h6.2L16 21.5 22.8 6H29L18.6 27h-5.2z" fill="currentColor" />
      <path d="M12.4 6h7.2L16 14.2z" fill="#C49A5A" />
    </svg>
  );
}

export function Logo({ light = true, className }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="VELORA home" className={cn("group inline-flex items-center gap-2.5", light ? "text-white" : "text-midnight", className)}>
      <LogoMark className="transition-transform duration-500 group-hover:scale-110" />
      <span className="text-[1.05rem] font-bold tracking-[0.42em]">VELORA</span>
    </Link>
  );
}
