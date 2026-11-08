"use client";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { CompareProvider } from "@/components/compare/CompareProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <CompareProvider>{children}</CompareProvider>
      </ToastProvider>
    </MotionConfig>
  );
}
