import { site } from "@/lib/site";

const POLICIES = [
  ["Eligibility", "Drivers must be 25 or older with a valid Nigerian or international driving licence held for at least 3 years. A government ID is checked at handover."],
  ["Security deposit", "A refundable deposit (shown on each vehicle) is collected at pickup by card or transfer and released within 5 business days of return, less any damage, fines or fuel charges."],
  ["Cancellation", `Free cancellation up to ${site.rental.cancellationHours} hours before pickup from your dashboard. Later cancellations may incur one day's rental. Paid bookings are refunded to the original payment method.`],
  ["Fuel & mileage", "Vehicles are supplied full and should be returned full. Daily allowance of 250 km; additional kilometres are billed at the published rate."],
  ["Insurance", "Comprehensive cover is included with a standard excess. Add Premium cover to reduce your excess to zero."],
  ["Chauffeur & security", "Chauffeur and security escort services operate in Lagos, Abuja and Port Harcourt and must be requested at booking."],
];

export function RentalPolicies() {
  return (
    <section id="policies" className="scroll-mt-24 border-t border-line bg-white py-16">
      <div className="container-x">
        <p className="eyebrow">Rental policies</p>
        <h2 className="display mt-2 text-3xl">Terms & conditions, in plain English.</h2>
        <dl className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {POLICIES.map(([t, d]) => (
            <div key={t} className="border-t border-midnight pt-4">
              <dt className="font-semibold">{t}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate">{d}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
