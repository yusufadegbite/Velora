import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, crumbs, children }: { eyebrow?: string; title: string; description?: string; crumbs?: { label: string; href?: string }[]; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-midnight pt-28 pb-12 text-white sm:pt-32 sm:pb-16">
      <div className="pointer-events-none absolute -top-32 right-0 h-72 w-[40rem] rounded-full bg-gold/10 blur-[120px]" aria-hidden />
      <div className="container-x relative">
        {crumbs && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/45">
              {crumbs.map((c, i) => (
                <li key={c.label} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="size-3" aria-hidden />}
                  {c.href ? <Link href={c.href} className="hover:text-gold">{c.label}</Link> : <span aria-current="page" className="text-white/75">{c.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display mt-3 max-w-3xl text-4xl text-balance sm:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl leading-relaxed text-white/60">{description}</p>}
        {children}
      </div>
    </section>
  );
}
