import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Common = { label: string; name: string; error?: string; hint?: string; className?: string; dark?: boolean; optional?: boolean };

function Wrapper({ label, name, error, hint, className, children, dark, optional }: Common & { children: ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={name} className={cn("block text-[0.78rem] font-semibold tracking-wide", dark ? "text-white/70" : "text-midnight/80")}>
        {label}
        {optional && <span className="ml-1 font-normal text-slate-light">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} role="alert" className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p id={`${name}-hint`} className={cn("text-xs", dark ? "text-white/45" : "text-slate")}>{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ label, name, error, hint, className, dark, optional, ...props }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrapper {...{ label, name, error, hint, className, dark, optional }}>
      <input id={name} name={name} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined} className={cn("field", dark && "field-dark")} {...props} />
    </Wrapper>
  );
}

export function Select({ label, name, error, hint, className, dark, optional, children, ...props }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Wrapper {...{ label, name, error, hint, className, dark, optional }}>
      <select id={name} name={name} aria-invalid={Boolean(error)} className={cn("field appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23697586%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_0.85rem_center] bg-no-repeat pr-9", dark && "field-dark")} {...props}>
        {children}
      </select>
    </Wrapper>
  );
}

export function Textarea({ label, name, error, hint, className, dark, optional, ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrapper {...{ label, name, error, hint, className, dark, optional }}>
      <textarea id={name} name={name} aria-invalid={Boolean(error)} className={cn("field min-h-28 resize-y", dark && "field-dark")} {...props} />
    </Wrapper>
  );
}

export function FormMessage({ state }: { state?: { ok?: boolean; message?: string } }) {
  if (!state?.message) return null;
  return (
    <div role={state.ok ? "status" : "alert"} className={cn("border-l-2 px-4 py-3 text-sm", state.ok ? "border-success bg-success/8 text-success" : "border-danger bg-danger/8 text-danger")}>
      {state.message}
    </div>
  );
}
