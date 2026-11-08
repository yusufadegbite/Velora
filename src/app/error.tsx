"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="grid min-h-[70vh] place-items-center px-6 pt-20 text-center">
      <div>
        <p className="eyebrow">Something went wrong</p>
        <h1 className="display mt-3 text-3xl">We hit a bump in the road.</h1>
        <p className="mx-auto mt-3 max-w-md text-slate">Please try again. If the problem continues, contact our team and quote reference {error.digest ?? "—"}.</p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
