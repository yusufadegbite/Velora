import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { site } from "@/lib/site";
import { formatDateTime, formatPrice, label, whatsappLink } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { Timeline } from "@/components/dashboard/Timeline";
import { PayButton } from "@/components/dashboard/PayButton";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { cancelOrderAction } from "@/actions/commerce";

export const metadata = { title: "Order details" };

const STEPS = ["Placed", "Payment", "Confirmed", "Processing", "Completed"];
const STEP_INDEX: Record<string, number> = { PENDING: 0, AWAITING_PAYMENT: 1, PAYMENT_CONFIRMED: 2, PROCESSING: 3, COMPLETED: 5, CANCELLED: 0 };

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ payment?: string; created?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  // Ownership check: users can only load their own orders.
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: { items: { include: { vehicle: { select: { slug: true, images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } } } } }, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();
  const item = order.items[0];
  const paid = order.payments.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + Number(p.amount), 0);
  const holdActive = order.status === "AWAITING_PAYMENT" && order.holdExpiresAt && order.holdExpiresAt > new Date();
  const notices: Record<string, { tone: string; Icon: typeof CheckCircle2; text: string }> = {
    success: { tone: "border-success bg-success/8 text-success", Icon: CheckCircle2, text: "Payment verified. Your order is confirmed — your advisor will be in touch shortly." },
    failed: { tone: "border-danger bg-danger/8 text-danger", Icon: AlertTriangle, text: "The payment was not completed. No funds were captured. You can try again below." },
    pending: { tone: "border-warning bg-warning/8 text-warning", Icon: Clock, text: "Your payment is still being processed. This page will reflect the result once Paystack confirms it." },
    error: { tone: "border-warning bg-warning/8 text-warning", Icon: Clock, text: "We couldn't verify the payment just now. If you were charged, it will be confirmed automatically via Paystack's webhook." },
    unavailable: { tone: "border-warning bg-warning/8 text-warning", Icon: Clock, text: "Online payment is currently unavailable, so your order is held as “Awaiting Payment”. An advisor will contact you to arrange payment." },
  };
  const notice = sp.payment ? notices[sp.payment] : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard/orders" className="text-xs text-slate hover:text-midnight">← All orders</Link>
          <h1 className="display mt-2 text-3xl">Order {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-slate">Placed {formatDateTime(order.createdAt)} · {label("paymentOption", order.paymentOption)}</p>
        </div>
        <StatusBadge status={order.status} label={label("orderStatus", order.status)} />
      </div>
      {sp.created && !notice && <p role="status" className="flex gap-2 border-l-2 border-success bg-success/8 px-4 py-3 text-sm text-success"><CheckCircle2 className="size-4" />{order.paymentOption === "ENQUIRY" ? "Enquiry received. A VELORA advisor will contact you within one business day." : "Order created."}</p>}
      {notice && <p role="status" className={`flex gap-2 border-l-2 px-4 py-3 text-sm ${notice.tone}`}><notice.Icon className="mt-0.5 size-4 shrink-0" />{notice.text}</p>}

      {order.paymentOption !== "ENQUIRY" && <div className="border border-line bg-white p-6"><Timeline steps={STEPS} current={STEP_INDEX[order.status]} cancelled={order.status === "CANCELLED"} /></div>}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section className="border border-line bg-white">
          <div className="flex gap-4 border-b border-line p-5">
            <div className="relative aspect-[16/10] w-32 shrink-0 overflow-hidden bg-midnight"><VehicleImage src={item.vehicle.images[0]?.url ?? null} alt="" fill sizes="128px" /></div>
            <div><Link href={`/cars/${item.vehicle.slug}`} className="font-semibold hover:underline">{item.title}</Link><p className="mt-1 text-sm text-slate">{formatPrice(Number(item.unitPrice))}</p></div>
          </div>
          <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-slate">Customer</dt><dd className="mt-0.5 font-medium">{order.customerName}<br />{order.email}<br />{order.phone}</dd></div>
            <div><dt className="text-xs text-slate">{order.fulfilment === "DELIVERY" ? "Delivery to" : "Fulfilment"}</dt><dd className="mt-0.5 font-medium">{order.fulfilment === "DELIVERY" ? <>{order.deliveryAddress}<br />{order.city}, {order.state}</> : "Showroom collection"}</dd></div>
            <div><dt className="text-xs text-slate">Billing</dt><dd className="mt-0.5 font-medium">{order.billingName}<br />{order.billingAddress}</dd></div>
            {order.notes && <div><dt className="text-xs text-slate">Notes</dt><dd className="mt-0.5">{order.notes}</dd></div>}
            {order.cancelReason && <div><dt className="text-xs text-slate">Cancellation reason</dt><dd className="mt-0.5">{order.cancelReason}</dd></div>}
          </dl>
        </section>
        <aside className="space-y-4">
          <div className="border border-line bg-white p-5">
            <h2 className="font-semibold">Payment summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate">Vehicle price</dt><dd className="tabular-nums">{formatPrice(Number(order.subtotal))}</dd></div>
              <div className="flex justify-between"><dt className="text-slate">Due online</dt><dd className="tabular-nums">{formatPrice(Number(order.amountDue))}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Paid to date</dt><dd className="tabular-nums">{formatPrice(paid)}</dd></div>
            </dl>
            {order.payments.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-line pt-4 text-xs">
                {order.payments.map((p) => <li key={p.id} className="flex items-center justify-between gap-2"><span className="truncate font-mono text-slate">{p.reference}</span><StatusBadge status={p.status} label={label("paymentStatus", p.status)} /></li>)}
              </ul>
            )}
            {order.status === "AWAITING_PAYMENT" && (
              <div className="mt-5 space-y-2">
                {env.paystack.enabled ? <PayButton kind="order" id={order.id} label={`Pay ${formatPrice(Number(order.amountDue))}`} /> : <p className="text-xs text-warning">Online payment isn&apos;t configured on this server. Your advisor will arrange payment with you.</p>}
                {holdActive && <p className="text-xs text-slate">Vehicle held until {formatDateTime(order.holdExpiresAt!)}.</p>}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={whatsappLink(site.whatsapp, `Hello VELORA, I have a question about order ${order.orderNumber}.`)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center px-4 text-xs font-semibold text-midnight underline underline-offset-4">Ask about this order</a>
            {["PENDING", "AWAITING_PAYMENT"].includes(order.status) && (
              <ConfirmButton action={cancelOrderAction.bind(null, order.id)} title="Cancel this order?" description="The vehicle will be released for other customers. This can't be undone." confirmLabel="Cancel order" reasonLabel="Reason (optional)">Cancel order</ConfirmButton>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
