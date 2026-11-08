import type { ReactNode } from "react";
export function DashHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="display text-3xl">{title}</h1>{description && <p className="mt-2 text-sm text-slate">{description}</p>}</div>
      {action}
    </div>
  );
}
