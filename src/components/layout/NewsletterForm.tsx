"use client";
import { useActionState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { subscribeNewsletter } from "@/actions/engagement";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, action] = useActionState(subscribeNewsletter, undefined);
  if (state?.ok)
    return <p role="status" className="flex items-center gap-2 text-sm text-gold"><Check className="size-4" />{state.message}</p>;
  return (
    <form action={action} className="w-full" noValidate>
      <div className="flex border border-white/15 bg-white/[0.03] focus-within:border-gold">
        <label htmlFor={compact ? "nl-email-c" : "nl-email"} className="sr-only">Email address</label>
        <input id={compact ? "nl-email-c" : "nl-email"} name="email" type="email" required autoComplete="email" placeholder="Your email address" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none" />
        <SubmitButton size="md" className="h-auto rounded-none" pendingText="…">Subscribe <ArrowRight className="size-4" /></SubmitButton>
      </div>
      {state?.message && !state.ok && <p role="alert" className="mt-2 text-xs text-[#ef8f7d]">{state.message}</p>}
    </form>
  );
}
