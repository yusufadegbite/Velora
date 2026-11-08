"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";

export type CompareEntry = { id: string; name: string; image: string | null; year: number };
type Ctx = { items: CompareEntry[]; has: (id: string) => boolean; toggle: (e: CompareEntry) => void; remove: (id: string) => void; clear: () => void; max: number };

const MAX = 4;
const KEY = "velora-compare";
const CompareCtx = createContext<Ctx | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareEntry[]>([]);
  const toast = useToast();
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems((JSON.parse(raw) as CompareEntry[]).slice(0, MAX));
    } catch { /* storage unavailable */ }
  }, []);
  const persist = (next: CompareEntry[]) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const toggle = useCallback((e: CompareEntry) => {
    if (items.some((c) => c.id === e.id)) {
      const next = items.filter((c) => c.id !== e.id);
      setItems(next);
      persist(next);
      return;
    }
    if (items.length >= MAX) {
      toast(`You can compare up to ${MAX} vehicles. Remove one first.`, "error");
      return;
    }
    const next = [...items, e];
    setItems(next);
    persist(next);
    toast(`${e.name} added to comparison`, "success");
  }, [items, toast]);
  const remove = useCallback((id: string) => setItems((cur) => { const n = cur.filter((c) => c.id !== id); persist(n); return n; }), []);
  const clear = useCallback(() => { setItems([]); persist([]); }, []);
  const value = useMemo(() => ({ items, has: (id: string) => items.some((i) => i.id === id), toggle, remove, clear, max: MAX }), [items, toggle, remove, clear]);
  return <CompareCtx.Provider value={value}>{children}</CompareCtx.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareCtx);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
