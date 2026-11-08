import type { LucideIcon } from "lucide-react";

export type SpecRow = { label: string; value: string | number | null | undefined; Icon?: LucideIcon };

export function SpecificationTable({ title, rows }: { title: string; rows: SpecRow[] }) {
  const visible = rows.filter((r) => r.value !== null && r.value !== undefined && r.value !== "");
  if (!visible.length) return null;
  return (
    <section aria-labelledby={`spec-${title}`}>
      <h3 id={`spec-${title}`} className="mb-3 text-xs font-semibold tracking-[0.2em] text-slate uppercase">{title}</h3>
      <dl className="divide-y divide-line border-y border-line">
        {visible.map(({ label, value, Icon }) => (
          <div key={label} className="grid grid-cols-[1fr_1.2fr] items-center gap-4 py-3 text-sm">
            <dt className="flex items-center gap-2.5 text-slate">{Icon && <Icon className="size-4 text-gold" aria-hidden />}{label}</dt>
            <dd className="text-right font-medium text-midnight sm:text-left">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
