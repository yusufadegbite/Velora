import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";

export type Column = { key: string; header: string; className?: string };
export type Row = { id: string; cells: Record<string, ReactNode> };
type Filter = { name: string; label: string; options: [string, string][] };

/** Server-rendered data table with GET-based search, filters and pagination (works without JS). */
export function AdminDataTable({ columns, rows, basePath, params, page, pages, total, searchPlaceholder = "Search…", filters = [], empty = "No records found." }: {
  columns: Column[]; rows: Row[]; basePath: string; params: Record<string, string | string[] | undefined>;
  page: number; pages: number; total: number; searchPlaceholder?: string; filters?: Filter[]; empty?: string;
}) {
  const q = typeof params.q === "string" ? params.q : "";
  return (
    <div className="border border-line bg-white">
      <form method="get" action={basePath} className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate" />
          <input name="q" defaultValue={q} placeholder={searchPlaceholder} className="field h-10 py-0 pl-9" />
        </label>
        {filters.map((f) => (
          <label key={f.name}>
            <span className="sr-only">{f.label}</span>
            <select name={f.name} defaultValue={typeof params[f.name] === "string" ? (params[f.name] as string) : ""} className="field h-10 py-0 pr-8 sm:w-48">
              <option value="">{f.label}: all</option>
              {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        ))}
        <button className="h-10 bg-midnight px-5 text-sm font-semibold text-white">Apply</button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line bg-ivory/60 text-left">
              {columns.map((c) => <th key={c.key} scope="col" className={cn("px-4 py-3 text-[0.68rem] font-semibold tracking-[0.14em] text-slate uppercase", c.className)}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-slate">{empty}</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-ivory/50">
                {columns.map((c) => <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>{r.cells[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-slate">
        <span>{total} record{total !== 1 && "s"}</span>
        <div className="-mt-12"><Pagination page={page} pages={pages} basePath={basePath} params={params} /></div>
      </div>
    </div>
  );
}
