"use client";
import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { useToast } from "./Toast";

/** A button that asks for confirmation before running a destructive server action. */
export function ConfirmButton({
  action, title, description, confirmLabel = "Confirm", children, variant = "outline", size = "sm", reasonLabel,
}: {
  action: (reason?: string) => Promise<{ ok: boolean; message: string } | void>;
  title: string; description: string; confirmLabel?: string; children: ReactNode;
  variant?: "outline" | "danger" | "dark" | "primary" | "ghost"; size?: "sm" | "md"; reasonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <>
      <Button type="button" variant={variant} size={size} onClick={() => setOpen(true)}>{children}</Button>
      <Dialog open={open} onClose={() => !pending && setOpen(false)} title={title}>
        <p className="text-sm leading-relaxed text-slate">{description}</p>
        {reasonLabel && (
          <label className="mt-4 block text-sm">
            <span className="mb-1.5 block text-xs font-semibold">{reasonLabel}</span>
            <textarea className="field min-h-20" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </label>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Keep it</Button>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await action(reason || undefined);
                if (res) toast(res.message, res.ok ? "success" : "error");
                setOpen(false);
              })
            }
          >
            {pending && <Loader2 className="size-4 animate-spin" />} {confirmLabel}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
