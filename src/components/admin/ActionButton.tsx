"use client";
import { useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

/** Runs a server action (already bound with its arguments) and shows a toast. */
export function ActionButton({ action, children, className, title }: { action: () => Promise<{ ok: boolean; message: string }>; children: ReactNode; className?: string; title?: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button type="button" title={title} disabled={pending} onClick={() => start(async () => { const r = await action(); toast(r.message, r.ok ? "success" : "error"); router.refresh(); })}
      className={cn("inline-flex items-center gap-1.5 text-xs font-semibold transition disabled:opacity-50", className)}>
      {pending && <Loader2 className="size-3 animate-spin" />}{children}
    </button>
  );
}
