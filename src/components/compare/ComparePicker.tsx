"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Plus, Save, Loader2 } from "lucide-react";
import { useCompare } from "./CompareProvider";
import { saveComparison } from "@/actions/engagement";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

/** Syncs URL ↔ local compare tray, lets users add vehicles and save the comparison. */
export function ComparePicker({ options, currentIds }: { options: { id: string; label: string; image: string | null; year: number; name: string }[]; currentIds: string[] }) {
  const { items, toggle, has, max } = useCompare();
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [choice, setChoice] = useState("");

  useEffect(() => {
    if (currentIds.length === 0 && items.length >= 2) router.replace(`/compare?ids=${items.map((i) => i.id).join(",")}`);
  }, [currentIds.length, items, router]);

  const add = () => {
    const o = options.find((x) => x.id === choice);
    if (!o) return;
    if (!has(o.id)) toggle({ id: o.id, name: o.name, image: o.image, year: o.year });
    const ids = [...new Set([...currentIds, o.id])].slice(0, max);
    router.replace(`/compare?ids=${ids.join(",")}`);
    setChoice("");
  };
  const save = () => start(async () => {
    const res = await saveComparison(currentIds);
    if (res.requiresLogin) { router.push("/login?next=" + encodeURIComponent(`/compare?ids=${currentIds.join(",")}`)); return; }
    toast(res.message, res.ok ? "success" : "error");
  });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {currentIds.length < max && (
        <div className="flex flex-1 gap-2">
          <label className="sr-only" htmlFor="add-vehicle">Add a vehicle</label>
          <select id="add-vehicle" value={choice} onChange={(e) => setChoice(e.target.value)} className="field h-11 max-w-md py-0">
            <option value="">Add a vehicle to compare…</option>
            {options.filter((o) => !currentIds.includes(o.id)).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <Button variant="dark" onClick={add} disabled={!choice}><Plus className="size-4" />Add</Button>
        </div>
      )}
      {currentIds.length >= 2 && (
        <Button variant="outline" onClick={save} disabled={pending} className="sm:ml-auto">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save comparison
        </Button>
      )}
    </div>
  );
}
