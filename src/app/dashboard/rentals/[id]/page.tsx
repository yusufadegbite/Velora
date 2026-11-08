import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, AlertTriangle, Clock, MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { site } from "@/lib/site";
import { canCustomerCancel } from "@/lib/services/rentals";
import { formatDateTime, formatPrice, label } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { Timeline } from "@/components/dashboard/Timeline";
import { PayButton } from "@/components/dashboard/PayButton";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { cancelRentalAction } from "@/actions/commerce";

export const metadata = { title: "Booking details" };
const IDX: Record<string, number> = { PENDING: 1, CONFIRMED: 2, ACTIVE: 3, COMPLETED: 4 };

export default async function BookingDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; payment?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const b = await prisma.rentalBooking.findFirst({
    where: { id, userId: user.id },
    include: { vehicle: { select: { slug: true, year: true, model: true, trim: true, brand: { select: { name: true } }, images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } } }, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!b) notFound();
  const paid = b.payments.some((p) => p.status === "SUCCESS");
  const extras = site.rental.extras.filter((x) => b.extras.includes(x.code));
  const cancellable = canCustomerCancel(b);
  const ended = ["CANCELLED", "REJECTED"].includes(b.status);
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard/rentals" className="text-xs text-slate hover:text-midnight">← All bookings</Link>
          <h1 className="display mt-2 text-3xl">Booking {b.bookingNumber}</h1>
          <p className="mt-1 text-sm text-slate">Requested {formatDateTime(b.createdAt)}</p>
        </div>
        <div className="flex gap-2">{paid && <StatusBadge status="SUCCESS" label="Paid" />}<StatusBadge status={b.status} label={label("rentalStatus", b.status)} /></div>
      </div>
      {sp.created && <p role="status" className="flex gap-2 border-l-2 border-success bg-success/8 px-4 py-3 text-sm text-success"><CheckCircle2 className="size-4" />Booking request received. We&apos;ve sent a confirmation to {b.email}; our concierge will confirm availability shortly.</p>}
      {sp.payment === "success" && <p role="status" className="flex gap-2 border-l-2 border-success bg-success/8 px-4 py-3 text-sm text-success"><CheckCircle2 className="size-4" />Payment verified. You&apos;re all set.</p>}
      {sp.payment === "failed" && <p role="alert" className="flex gap-2 border-l-2 border-danger bg-danger/8 px-4 py-3 text-sm text-danger"><AlertTriangle className="size-4" />Payment was not completed. You can try again.</p>}
      {(sp.payment === "pending" || sp.payment === "error") && <p role="status" className="flex gap-2 border-l-2 border-warning bg-warning/8 px-4 py-3 text-sm text-warning"><Clock className="size-4" />We're still waiting for Paystack to confirm the payment.</p>}

      <div className="border border-line bg-white p-6"><Timeline steps={["Requested", "Under review", "Confirmed", "On the road", "Returned"]} current={IDX[b.status] ?? 0} cancelled={ended} /></div>
      {ended && <p className="text-sm text-slate">This booking was {b.status.toLowerCase()}{b.cancelReason ? `: ${b.cancelReason}` : "."}</p>}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section className="border border-line bg-white">
          <div className="flex gap-4 border-b border-line p-5">
            <div className="relative aspect-[16/10] w-32 shrink-0 overflow-hidden bg-midnight"><VehicleImage src={b.vehicle.images[0]?.url ?? null} alt="" fill sizes="128px" /></div>
            <div><Link href={`/rentals/${b.vehicle.slug}`} className="font-semibold hover:underline">{b.vehicle.year} {b.vehicle.brand.name} {b.vehicle.model}</Link><p className="mt-1 text-sm text-slate">{b.days} day{b.days > 1 && "s"} · {b.rateType.toLowerCase()} rate</p></div>
          </div>
          <dl className="grid gap-5 p-5 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-slate">Pickup</dt><dd className="mt-1 font-medium">{formatDateTime(b.pickupAt)}</dd><dd className="mt-0.5 flex gap-1.5 text-slate"><MapPin className="mt-0.5 size-3.5 text-gold" />{b.pickupLocation}</dd></div>
            <div><dt className="text-xs text-slate">Return</dt><dd className="mt-1 font-medium">{formatDateTime(b.returnAt)}</dd><dd className="mt-0.5 flex gap-1.5 text-slate"><MapPin className="mt-0.5 size-3.5 text-gold" />{b.returnLocation}</dd></div>
            <div><dt className="text-xs text-slate">Driver</dt><dd className="mt-1 font-medium">{b.customerName}<br />{b.phone}<br />Licence {b.driverLicense}</dd></div>
            <div><dt className="text-xs text-slate">Extras</dt><dd className="mt-1">{extras.length ? extras.map((x) => x.label).join(", ") : "None"}</dd></div>
            {b.notes && <div className="sm:col-span-2"><dt className="text-xs text-slate">Notes</dt><dd className="mt-1">{b.notes}</dd></div>}
          </dl>
        </section>
        <aside className="space-y-4">
          <div className="border border-line bg-white p-5">
            <h2 className="font-semibold">Price breakdown</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate">Rental</dt><dd className="tabular-nums">{formatPrice(Number(b.rentalCost))}</dd></div>
              <div className="flex justify-between"><dt className="text-slate">Extras</dt><dd className="tabular-nums">{formatPrice(Number(b.extrasCost))}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(Number(b.total))}</dd></div>
              <div className="flex justify-between text-xs text-slate"><dt>Security deposit (at pickup, refundable)</dt><dd className="tabular-nums">{formatPrice(Number(b.securityDeposit))}</dd></div>
            </dl>
            {b.status === "CONFIRMED" && !paid && (
              <div className="mt-5">{env.paystack.enabled ? <PayButton kind="rental" id={b.id} label={`Pay ${formatPrice(Number(b.total))}`} /> : <p className="text-xs text-warning">Online payment isn&apos;t configured on this server. You can pay at pickup.</p>}</div>
            )}
            {b.status === "PENDING" && <p className="mt-4 text-xs text-slate">Payment opens once our concierge confirms your booking.</p>}
          </div>
          {cancellable ? (
            <ConfirmButton action={cancelRentalAction.bind(null, b.id)} title="Cancel this booking?" description={paid ? "Your payment will be refunded to the original payment method within 5–10 business days." : "The dates will be released. This can't be undone."} confirmLabel="Cancel booking" reasonLabel="Reason (optional)">Cancel booking</ConfirmButton>
          ) : !ended && b.status !== "COMPLETED" && <p className="text-xs text-slate">Online cancellation closes {site.rental.cancellationHours} hours before pickup. Please contact concierge for changes.</p>}
        </aside>
      </div>
    </div>
  );
}
