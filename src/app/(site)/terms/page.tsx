import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Sale & Rental" };

export default function TermsPage() {
  const sections: [string, string][] = [
    ["1. Listings", "Vehicle information is provided in good faith following inspection. Specifications may vary slightly; your advisor will confirm details before handover."],
    ["2. Pricing", "All prices are in Nigerian Naira and are calculated by VELORA's systems at the time of order. Prices shown in your browser are for information only; the amount charged is always the server-calculated amount."],
    ["3. Reservations", `A reservation deposit of ${Math.round(site.commerce.depositRate * 100)}% removes the vehicle from sale. It is fully refundable if the vehicle fails inspection or documentation checks, and is otherwise credited against the purchase price.`],
    ["4. Payments", "Online payments are processed by Paystack. An order is only confirmed once VELORA has independently verified the payment with the payment provider."],
    ["5. Cancellations", "Orders that have not been paid may be cancelled at any time from your dashboard. Cancellation of paid orders is handled by your advisor."],
    ["6. Rentals", `Rental bookings are subject to approval and to the rental policies published on the Rentals page. Free cancellation applies up to ${site.rental.cancellationHours} hours before pickup.`],
    ["7. Contact", `Questions about these terms can be sent to ${site.email}.`],
  ];
  return (
    <>
      <PageHeader title="Terms of Sale & Rental" crumbs={[{ label: "Home", href: "/" }, { label: "Terms" }]} />
      <article className="container-x max-w-3xl space-y-8 py-14">
        <p className="text-sm text-slate">This summary is provided for development purposes and should be reviewed by legal counsel before commercial launch.</p>
        {sections.map(([t, d]) => <section key={t}><h2 className="text-lg font-semibold">{t}</h2><p className="mt-2 leading-relaxed text-midnight/80">{d}</p></section>)}
      </article>
    </>
  );
}
