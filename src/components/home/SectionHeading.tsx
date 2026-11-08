import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({ eyebrow, title, description, href, linkLabel = "View all", dark, align = "left" }: { eyebrow: string; title: string; description?: string; href?: string; linkLabel?: string; dark?: boolean; align?: "left" | "center" }) {
  return (
    <Reveal className={cn("mb-10 flex flex-col gap-5 sm:mb-14 md:flex-row md:items-end md:justify-between", align === "center" && "items-center text-center md:flex-col md:items-center")}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className={cn("display mt-3 text-3xl sm:text-[2.6rem]", dark && "text-white")}>{title}</h2>
        {description && <p className={cn("mt-4 text-[0.95rem] leading-relaxed", dark ? "text-white/60" : "text-slate")}>{description}</p>}
      </div>
      {href && (
        <Link href={href} className={cn("group inline-flex shrink-0 items-center gap-2 text-sm font-semibold", dark ? "text-white" : "text-midnight")}>
          <span className="border-b border-gold pb-0.5">{linkLabel}</span>
          <ArrowRight className="size-4 text-gold transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </Reveal>
  );
}
