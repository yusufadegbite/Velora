import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { adminPaging } from "@/lib/admin";
import { formatDate, formatPrice, label, LABELS } from "@/lib/utils";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { StatusControl } from "@/components/admin/StatusControl";
import { StatusBadge } from "@/components/ui/Badge";
import { updateOrderStatus } from "@/actions/admin";

export const metadata = { title: "Orders" };

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["AWAITING_PAYMENT", "PROCESSING", "CANCELLED"], AWAITING_PAYMENT: ["PAYMENT_CONFIRMED", "CANCELLED"],
  PAYMENT_CONFIRMED: ["PROCESSING", "CANCELLED"], PROCESSING: ["COMPLETED", "CANCELLED"], COMPLETED: [], CANCELLED: [],
};

export default async function AdminOrders({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { page, q, skip, take, str, pages } = adminPaging(sp);
  const status = str("status"), option = str("option");
  const where: Prisma.OrderWhereInput = {
    ...(q ? { OR: [{ orderNumber: { contains: q, mode: "insensitive" } }, { customerName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { items: { some: { title: { contains: q, mode: "insensitive" } } } }] } : {}),
    ...(status in LABELS.orderStatus ? { status: status as OrderStatus } : {}),
    ...(option in LABELS.paymentOption ? { paymentOption: option as keyof typeof LABELS.paymentOption } : {}),
  };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, include: { items: true, payments: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" }, skip, take }),
  ]);
  const rows = orders.map((o) => {
    const paid = o.payments.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + Number(p.amount), 0);
    const last = o.payments[0];
    return {
      id: o.id,
      cells: {
        order: <div><p className="font-semibold">{o.orderNumber}</p><p className="text-xs text-slate">{formatDate(o.createdAt)}</p></div>,
        customer: <div><p className="font-medium">{o.customerName}</p><p className="text-xs text-slate">{o.email} · {o.phone}</p></div>,
        vehicle: <div><p className="max-w-56 truncate">{o.items[0]?.title}</p><p className="text-xs text-slate">{label("paymentOption", o.paymentOption)} · {o.fulfilment === "DELIVERY" ? `Deliver to ${o.city}` : "Collection"}</p></div>,
        amount: <div className="tabular-nums"><p className="font-semibold">{formatPrice(Number(o.subtotal))}</p><p className="text-xs text-slate">Paid {formatPrice(paid)}</p></div>,
        payment: last ? <div className="space-y-1"><StatusBadge status={last.status} label={label("paymentStatus", last.status)} /><p className="max-w-36 truncate font-mono text-[0.65rem] text-slate">{last.provider} · {last.reference}</p></div> : <span className="text-xs text-slate">None</span>,
        status: <div className="space-y-1"><StatusBadge status={o.status} label={label("orderStatus", o.status)} />{o.adminNote && <p className="max-w-48 text-[0.7rem] leading-snug text-warning">{o.adminNote}</p>}</div>,
        actions: <StatusControl entityLabel={o.orderNumber} action={updateOrderStatus.bind(null, o.id) as (s: string, n?: string) => Promise<{ ok: boolean; message: string }>} options={NEXT[o.status].map((s) => ({ value: s, label: s === "PAYMENT_CONFIRMED" ? "Confirm offline payment" : label("orderStatus", s), destructive: s === "CANCELLED", needsNote: s === "PAYMENT_CONFIRMED" }))} />,
      },
    };
  });
  return (
    <>
      <div className="mb-6"><h1 className="display text-3xl">Orders</h1><p className="mt-1 text-sm text-slate">Track payments, update progress and manage cancellations. Online payments are confirmed automatically after Paystack verification.</p></div>
      <AdminDataTable basePath="/admin/orders" params={sp} page={page} pages={pages(total)} total={total} searchPlaceholder="Order number, customer, vehicle…"
        filters={[{ name: "status", label: "Status", options: Object.entries(LABELS.orderStatus) }, { name: "option", label: "Type", options: Object.entries(LABELS.paymentOption) }]}
        columns={[{ key: "order", header: "Order" }, { key: "customer", header: "Customer" }, { key: "vehicle", header: "Vehicle" }, { key: "amount", header: "Amount" }, { key: "payment", header: "Payment" }, { key: "status", header: "Status" }, { key: "actions", header: "Update" }]}
        rows={rows} />
    </>
  );
}
