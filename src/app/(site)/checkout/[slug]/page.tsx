import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ShieldCheck, BadgeCheck, Clock } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getVehicleBySlug } from "@/lib/data/vehicles";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { site } from "@/lib/site";
import { allowedPaymentOptions, amountDueNow } from "@/lib/pricing/order";
import { formatMileage, formatPrice, label } from "@/lib/utils";
import { CheckoutForm } from "@/components/forms/CheckoutForm";
import { VehicleImage } from "@/components/ui/VehicleImage";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/checkout/${slug}`);
  const v = await getVehicleBySlug(slug);
  if (!v) notFound();
  if (!v.forSale || v.status !== "AVAILABLE") redirect(`/cars/${slug}`);
  const profile = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true, email: true, phone: true } });
  const deposit = Math.round(site.commerce.depositRate * 100);
  const descriptions = {
    FULL_PAYMENT: { title: "Pay in full", description: "Complete the purchase online. Documentation and handover are arranged immediately after payment is verified." },
    RESERVATION_DEPOSIT: { title: `Reserve with a ${deposit}% deposit`, description: "Take the vehicle off the market today. The balance is settled with your advisor after inspection — by transfer, financing or trade-in." },
    ENQUIRY: { title: "Purchase enquiry", description: "No payment now. A VELORA advisor will contact you within one business day to discuss inspection, financing and next steps." },
  } as const;
  const options = allowedPaymentOptions(v.price).map((key) => ({ key, ...descriptions[key], amount: amountDueNow(v.price, key) }));
  const name = `${v.year} ${v.name}${v.trim ? ` ${v.trim}` : ""}`;

  return (
    <>
      <div className="bg-midnight pt-20" />
      <section className="container-x grid gap-12 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="eyebrow">Secure checkout</p>
          <h1 className="display mt-2 mb-10 text-3xl sm:text-4xl">Complete your order</h1>
          <CheckoutForm vehicleId={v.id} options={options} user={profile} gatewayEnabled={env.paystack.enabled} />
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-line bg-white">
            <div className="relative aspect-[16/10] bg-midnight"><VehicleImage src={v.image} alt={name} fill sizes="400px" /></div>
            <div className="p-6">
              <p className="text-xs font-semibold tracking-[0.2em] text-slate uppercase">Order summary</p>
              <h2 className="mt-2 text-lg font-semibold">{name}</h2>
              <p className="mt-1 text-sm text-slate">{formatMileage(v.mileage)} · {label("transmission", v.transmission)} · {v.exteriorColor}</p>
              <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
                <div className="flex justify-between"><dt className="text-slate">Vehicle price</dt><dd className="font-semibold tabular-nums">{formatPrice(v.price)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate">Delivery</dt><dd>Complimentary</dd></div>
                <div className="flex justify-between"><dt className="text-slate">Registration & plates</dt><dd>Included</dd></div>
                <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(v.price)}</dd></div>
              </dl>
              <ul className="mt-6 space-y-2.5 text-xs text-slate">
                <li className="flex gap-2"><ShieldCheck className="size-4 text-gold" />Amounts are calculated on our server</li>
                <li className="flex gap-2"><Clock className="size-4 text-gold" />Vehicle held for {site.commerce.orderHoldMinutes} minutes while you pay</li>
                <li className="flex gap-2"><BadgeCheck className="size-4 text-gold" />Refundable deposit if inspection fails</li>
              </ul>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
