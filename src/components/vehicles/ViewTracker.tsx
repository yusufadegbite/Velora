"use client";
import { useEffect } from "react";
import { trackVehicleView } from "@/actions/engagement";

export function ViewTracker({ id }: { id: string }) {
  useEffect(() => {
    const key = `viewed:${id}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
    void trackVehicleView(id);
  }, [id]);
  return null;
}
