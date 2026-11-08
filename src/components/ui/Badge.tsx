import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const tones = {
  neutral: "bg-midnight/6 text-midnight/80",
  gold: "bg-gold/15 text-gold-dark",
  dark: "bg-midnight text-white",
  success: "bg-success/12 text-success",
  danger: "bg-danger/12 text-danger",
  warning: "bg-warning/12 text-warning",
  glass: "bg-white/90 text-midnight backdrop-blur",
} as const;

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: keyof typeof tones; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-[2px] px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em]", tones[tone], className)}>{children}</span>;
}

const STATUS_TONES: Record<string, keyof typeof tones> = {
  AVAILABLE: "success", RESERVED: "warning", SOLD: "dark", ARCHIVED: "neutral",
  PENDING: "warning", AWAITING_PAYMENT: "warning", PAYMENT_CONFIRMED: "success", PROCESSING: "gold", COMPLETED: "success", CANCELLED: "danger",
  CONFIRMED: "success", ACTIVE: "gold", REJECTED: "danger",
  SUCCESS: "success", FAILED: "danger", ABANDONED: "neutral", REFUNDED: "neutral",
  NEW: "gold", IN_PROGRESS: "warning", RESOLVED: "success",
};
export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge tone={STATUS_TONES[status] ?? "neutral"}>{label}</Badge>;
}
