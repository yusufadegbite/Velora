"use client";
import { useTransition } from "react";
import { Loader2, Lock } from "lucide-react";
import { payAction } from "@/actions/commerce";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

export function PayButton({ kind, id, label }: { kind: "order" | "rental"; id: string; label: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <Button size="lg" disabled={pending} onClick={() => start(async () => {
      const res = await payAction(kind, id);
      if (res.ok && res.url) window.location.href = res.url;
      else toast(res.message ?? "Payment could not be started.", "error");
    })}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />} {pending ? "Connecting to Paystack…" : label}
    </Button>
  );
}
