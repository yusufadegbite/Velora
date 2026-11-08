"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type Option = { value: string; label: string; destructive?: boolean; needsNote?: boolean };

/** Shows the allowed next statuses; each opens a confirmation dialog with an optional note. */
export function StatusControl({ options, action, entityLabel }: { options: Option[]; action: (status: string, note?: string) => Promise<{ ok: boolean; message: string }>; entityLabel: string }) {
  const [target, setTarget] = useState<Option | null>(null);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  if (!options.length) return <span className="text-xs text-slate">—</span>;
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o.value} type="button" onClick={() => { setTarget(o); setNote(""); }} className={o.destructive ? "border border-danger/30 px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger hover:text-white" : "border border-midnight/20 px-2.5 py-1 text-xs font-semibold hover:bg-midnight hover:text-white"}>
            {o.label}
          </button>
        ))}
      </div>
      <Dialog open={Boolean(target)} onClose={() => !pending && setTarget(null)} title={`${target?.label} — ${entityLabel}`}>
        <p className="text-sm text-slate">The customer will be notified by email and in their dashboard.</p>
        <label className="mt-4 block text-sm">
          <span className="mb-1.5 block text-xs font-semibold">{target?.needsNote ? "Payment reference / note (required)" : "Note (optional — shared with the customer for cancellations)"}</span>
          <textarea className="field min-h-20" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setTarget(null)} disabled={pending}>Back</Button>
          <Button variant={target?.destructive ? "danger" : "dark"} disabled={pending || (target?.needsNote && !note.trim())} onClick={() => start(async () => {
            const r = await action(target!.value, note || undefined);
            toast(r.message, r.ok ? "success" : "error");
            if (r.ok) { setTarget(null); router.refresh(); }
          })}>{pending && <Loader2 className="size-4 animate-spin" />}Confirm</Button>
        </div>
      </Dialog>
    </>
  );
}
