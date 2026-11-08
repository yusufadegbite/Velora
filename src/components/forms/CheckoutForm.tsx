"use client";
import { useActionState, useState } from "react";
import { Lock, Info } from "lucide-react";
import { checkoutAction } from "@/actions/commerce";
import { Input, Textarea, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn, formatPrice } from "@/lib/utils";

type Option = { key: "FULL_PAYMENT" | "RESERVATION_DEPOSIT" | "ENQUIRY"; title: string; description: string; amount: number };

export function CheckoutForm({ vehicleId, options, user, gatewayEnabled }: { vehicleId: string; options: Option[]; user: { name: string; email: string; phone: string | null }; gatewayEnabled: boolean }) {
  const [state, action] = useActionState(checkoutAction, undefined);
  const [opt, setOpt] = useState<Option["key"]>(options.find((o) => o.key === "RESERVATION_DEPOSIT")?.key ?? options[0].key);
  const [fulfilment, setFulfilment] = useState<"COLLECTION" | "DELIVERY">("COLLECTION");
  const e = state?.errors ?? {};
  const selected = options.find((o) => o.key === opt)!;
  const step = (n: number, t: string) => <legend className="mb-4 flex items-center gap-2 text-lg font-semibold"><span className="grid size-7 place-items-center bg-midnight text-xs text-gold">{n}</span>{t}</legend>;

  return (
    <form action={action} className="space-y-10" noValidate>
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <input type="hidden" name="paymentOption" value={opt} />
      <input type="hidden" name="fulfilment" value={fulfilment} />
      <FormMessage state={state} />

      <fieldset>
        {step(1, "How would you like to proceed?")}
        <div role="radiogroup" className="grid gap-3">
          {options.map((o) => (
            <button key={o.key} type="button" role="radio" aria-checked={opt === o.key} onClick={() => setOpt(o.key)} className={cn("flex items-start gap-4 border bg-white p-5 text-left transition", opt === o.key ? "border-midnight ring-1 ring-midnight" : "border-line hover:border-midnight/40")}>
              <span className={cn("mt-1 grid size-4 shrink-0 place-items-center rounded-full border", opt === o.key ? "border-midnight" : "border-slate-light")}>{opt === o.key && <span className="size-2 rounded-full bg-midnight" />}</span>
              <span className="flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-semibold">{o.title}</span><span className="text-sm font-bold tabular-nums">{o.amount > 0 ? `${formatPrice(o.amount)} now` : "No payment now"}</span></span>
                <span className="mt-1 block text-sm text-slate">{o.description}</span>
              </span>
            </button>
          ))}
        </div>
        {opt !== "ENQUIRY" && !gatewayEnabled && (
          <p className="mt-3 flex gap-2 border-l-2 border-warning bg-warning/8 px-4 py-3 text-sm text-warning"><Info className="mt-0.5 size-4 shrink-0" />Online payment is currently unavailable. Your order will be created and held as “Awaiting Payment”, and an advisor will contact you to arrange payment.</p>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        {step(2, "Your details")}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" name="customerName" defaultValue={user.name} error={e.customerName} autoComplete="name" required />
          <Input label="Email" name="email" type="email" defaultValue={user.email} error={e.email} autoComplete="email" required />
          <Input label="Phone" name="phone" type="tel" defaultValue={user.phone ?? ""} error={e.phone} autoComplete="tel" required />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        {step(3, "Delivery or collection")}
        <div className="grid grid-cols-2 gap-3">
          {(["COLLECTION", "DELIVERY"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={fulfilment === f} onClick={() => setFulfilment(f)} className={cn("border bg-white p-4 text-left text-sm transition", fulfilment === f ? "border-midnight ring-1 ring-midnight" : "border-line")}>
              <span className="block font-semibold">{f === "COLLECTION" ? "Showroom collection" : "Home delivery"}</span>
              <span className="text-xs text-slate">{f === "COLLECTION" ? "Private handover in Lagos or Abuja" : "Complimentary within Lagos & Abuja"}</span>
            </button>
          ))}
        </div>
        {fulfilment === "DELIVERY" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Input className="sm:col-span-3" label="Delivery address" name="deliveryAddress" error={e.deliveryAddress} autoComplete="street-address" required />
            <Input label="City" name="city" error={e.city} autoComplete="address-level2" required />
            <Input label="State" name="state" error={e.state} autoComplete="address-level1" required />
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        {step(4, "Billing information")}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Billing name / company" name="billingName" defaultValue={user.name} error={e.billingName} required />
          <Input label="Billing address" name="billingAddress" error={e.billingAddress} autoComplete="street-address" required />
        </div>
        <Textarea label="Notes" name="notes" rows={3} optional placeholder="Trade-in, financing, preferred viewing time…" />
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="acceptTerms" className="mt-1 size-4 accent-[#10151C]" />
          <span>I agree to the <a href="/terms" target="_blank" className="font-semibold underline">purchase terms</a>. Reservation deposits are refundable if the vehicle fails inspection or documentation checks.</span>
        </label>
        {e.acceptTerms && <p role="alert" className="text-xs font-medium text-danger">{e.acceptTerms}</p>}
      </fieldset>

      <div className="border-t border-line pt-6">
        <SubmitButton size="lg" className="w-full sm:w-auto" pendingText={opt === "ENQUIRY" ? "Sending…" : "Creating order…"}>
          {opt === "ENQUIRY" ? "Submit purchase enquiry" : <><Lock className="size-4" />{gatewayEnabled ? `Continue to secure payment · ${formatPrice(selected.amount)}` : "Place order"}</>}
        </SubmitButton>
        {opt !== "ENQUIRY" && gatewayEnabled && <p className="mt-3 text-xs text-slate">You'll be redirected to Paystack. Your payment is verified on our server before your order is confirmed.</p>}
      </div>
    </form>
  );
}
