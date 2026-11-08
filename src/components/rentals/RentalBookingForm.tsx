"use client";
import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Info, Check } from "lucide-react";
import { bookRentalAction } from "@/actions/commerce";
import { quoteRental, toInstant } from "@/lib/pricing/rental";
import { site } from "@/lib/site";
import { cn, formatPrice, formatDateTime } from "@/lib/utils";
import { Input, Select, Textarea, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

type Props = {
  vehicle: { id: string; name: string; dailyRate: number; weeklyRate: number | null; monthlyRate: number | null; securityDeposit: number };
  user: { name: string; email: string; phone: string | null } | null;
  unavailable: { start: string; end: string; kind: string }[];
};

const isoDate = (d: Date) => new Date(d.getTime() + 3600_000).toISOString().slice(0, 10); // Lagos (UTC+1)

export function RentalBookingForm({ vehicle, user, unavailable }: Props) {
  const [state, action] = useActionState(bookRentalAction, undefined);
  const today = isoDate(new Date());
  const tomorrow = isoDate(new Date(Date.now() + 86_400_000));
  const [pickupDate, setPickupDate] = useState(tomorrow);
  const [returnDate, setReturnDate] = useState(isoDate(new Date(Date.now() + 4 * 86_400_000)));
  const [pickupTime, setPickupTime] = useState("10:00");
  const [pickupLocation, setPickupLocation] = useState<string>(site.rental.locations[0]);
  const [returnLocation, setReturnLocation] = useState<string>(site.rental.locations[0]);
  const [extras, setExtras] = useState<string[]>([]);
  const e = state?.errors ?? {};

  const quote = useMemo(() => {
    const p = toInstant(pickupDate, pickupTime), r = toInstant(returnDate, pickupTime);
    if (Number.isNaN(p.getTime()) || Number.isNaN(r.getTime()) || r <= p) return null;
    return quoteRental({ pickupAt: p, returnAt: r, rates: vehicle, extras, securityDeposit: vehicle.securityDeposit });
  }, [pickupDate, returnDate, pickupTime, extras, vehicle]);

  const clash = useMemo(() => {
    const p = toInstant(pickupDate, pickupTime).getTime(), r = toInstant(returnDate, pickupTime).getTime();
    return unavailable.find((u) => new Date(u.start).getTime() < r && new Date(u.end).getTime() > p);
  }, [pickupDate, returnDate, pickupTime, unavailable]);

  const tooLong = quote && quote.days > site.rental.maxDays;

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1.3fr_1fr]" noValidate>
      <input type="hidden" name="vehicleId" value={vehicle.id} />
      <div className="space-y-8">
        <FormMessage state={state} />
        <fieldset className="space-y-4">
          <legend className="mb-2 flex items-center gap-2 text-lg font-semibold"><span className="grid size-7 place-items-center bg-midnight text-xs text-gold">1</span>Trip details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Pickup location" name="pickupLocation" value={pickupLocation} onChange={(ev) => { setPickupLocation(ev.target.value); if (returnLocation === pickupLocation) setReturnLocation(ev.target.value); }} error={e.pickupLocation}>
              {site.rental.locations.map((l) => <option key={l}>{l}</option>)}
            </Select>
            <Select label="Return location" name="returnLocation" value={returnLocation} onChange={(ev) => setReturnLocation(ev.target.value)} error={e.returnLocation}>
              {site.rental.locations.map((l) => <option key={l}>{l}</option>)}
            </Select>
            <Input label="Pickup date" name="pickupDate" type="date" min={today} value={pickupDate} onChange={(ev) => { setPickupDate(ev.target.value); if (ev.target.value >= returnDate) setReturnDate(isoDate(new Date(new Date(ev.target.value).getTime() + 2 * 86_400_000))); }} error={e.pickupDate} required />
            <Input label="Return date" name="returnDate" type="date" min={pickupDate} value={returnDate} onChange={(ev) => setReturnDate(ev.target.value)} error={e.returnDate} required />
            <Input label="Pickup time" name="pickupTime" type="time" step={1800} min="07:00" max="20:00" value={pickupTime} onChange={(ev) => setPickupTime(ev.target.value)} error={e.pickupTime} hint="Return is due at the same time on the return date (Lagos time)." required />
          </div>
          {clash && (
            <p role="alert" className="flex items-start gap-2 border-l-2 border-warning bg-warning/8 px-4 py-3 text-sm text-warning">
              <Info className="mt-0.5 size-4 shrink-0" />The vehicle is {clash.kind.toLowerCase()} {formatDateTime(clash.start)} – {formatDateTime(clash.end)}. Please choose dates outside this period.
            </p>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-4 flex items-center gap-2 text-lg font-semibold"><span className="grid size-7 place-items-center bg-midnight text-xs text-gold">2</span>Additional services <span className="text-sm font-normal text-slate">(optional)</span></legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {site.rental.extras.map((x) => {
              const on = extras.includes(x.code);
              return (
                <label key={x.code} className={cn("relative flex cursor-pointer gap-3 border bg-white p-4 transition", on ? "border-midnight ring-1 ring-midnight" : "border-line hover:border-midnight/40")}>
                  <input type="checkbox" name="extras" value={x.code} checked={on} onChange={() => setExtras((s) => (on ? s.filter((c) => c !== x.code) : [...s, x.code]))} className="sr-only" />
                  <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center border", on ? "border-midnight bg-midnight text-gold" : "border-line")}>{on && <Check className="size-3.5" />}</span>
                  <span className="text-sm">
                    <span className="block font-semibold">{x.label}</span>
                    <span className="mt-0.5 block text-xs text-slate">{x.description}</span>
                    <span className="mt-1.5 block text-xs font-semibold">{formatPrice(x.amount)} {x.pricing === "PER_DAY" ? "/ day" : "flat"}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-2 flex items-center gap-2 text-lg font-semibold"><span className="grid size-7 place-items-center bg-midnight text-xs text-gold">3</span>Driver details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name (as on licence)" name="customerName" defaultValue={user?.name} error={e.customerName} autoComplete="name" required />
            <Input label="Email" name="email" type="email" defaultValue={user?.email} error={e.email} autoComplete="email" required />
            <Input label="Phone" name="phone" type="tel" defaultValue={user?.phone ?? ""} error={e.phone} autoComplete="tel" required />
            <Input label="Driver's licence number" name="driverLicense" error={e.driverLicense} hint="A valid licence is checked at handover." required />
          </div>
          <Textarea label="Notes for our concierge" name="notes" rows={3} optional error={e.notes} placeholder="Flight number, delivery address, special requests…" />
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="acceptTerms" className="mt-1 size-4 accent-[#10151C]" />
            <span>I accept the <a href="#policies" className="font-semibold underline">rental policies</a>, including the refundable security deposit and fuel policy.</span>
          </label>
          {e.acceptTerms && <p role="alert" className="text-xs font-medium text-danger">{e.acceptTerms}</p>}
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="bg-midnight p-6 text-white sm:p-7">
          <p className="eyebrow">Your estimate</p>
          <h3 className="mt-2 text-xl font-semibold">{vehicle.name}</h3>
          {quote ? (
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-white/60"><CalendarDays className="size-4 text-gold" />{quote.days} day{quote.days > 1 && "s"} · {quote.rateType.toLowerCase()} rate applied</div>
              <div className="flex justify-between border-t border-white/10 pt-3"><dt className="text-white/60">Rental</dt><dd className="tabular-nums">{formatPrice(quote.rentalCost)}</dd></div>
              {quote.extraLines.map((l) => <div key={l.code} className="flex justify-between"><dt className="text-white/60">{l.label}</dt><dd className="tabular-nums">{formatPrice(l.amount)}</dd></div>)}
              <div className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold"><dt>Estimated total</dt><dd className="text-gold tabular-nums">{formatPrice(quote.total)}</dd></div>
              <div className="flex justify-between text-xs text-white/50"><dt>Refundable security deposit (at pickup)</dt><dd className="tabular-nums">{formatPrice(quote.securityDeposit)}</dd></div>
            </dl>
          ) : (
            <p className="mt-6 text-sm text-white/60">Choose a return date after your pickup date to see pricing.</p>
          )}
          {tooLong && <p className="mt-4 text-xs text-[#ef8f7d]">Online bookings are limited to {site.rental.maxDays} days. Contact us for long-term hire.</p>}
          <SubmitButton size="lg" className="mt-6 w-full" disabled={!quote || Boolean(clash) || Boolean(tooLong)} pendingText="Checking availability…">Request booking</SubmitButton>
          <p className="mt-4 text-xs leading-relaxed text-white/45">No payment is taken now. Availability is re-checked on our server when you submit; once our concierge confirms, you can pay securely online from your dashboard.</p>
        </div>
        {!user && <p className="mt-4 text-sm text-slate"><Link href="/login" className="font-semibold text-midnight underline">Sign in</Link> to book — it takes a minute.</p>}
      </aside>
    </form>
  );
}
