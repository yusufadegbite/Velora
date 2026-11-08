import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDate, formatPrice, label } from "@/lib/utils";
import { DashHeader } from "@/components/dashboard/DashHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { VehicleImage } from "@/components/ui/VehicleImage";

export const metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { vehicle: { select: { slug: true, images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } } } } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <DashHeader title="My Orders" description="Purchases, reservations and enquiries." />
      {orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders yet" description="When you reserve or enquire about a vehicle, it'll appear here with live status updates." action={<LinkButton href="/cars">Explore vehicles</LinkButton>} />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/dashboard/orders/${o.id}`} className="flex flex-col gap-4 border border-line bg-white p-4 transition hover:border-midnight/30 sm:flex-row sm:items-center">
                <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-midnight sm:w-36"><VehicleImage src={o.items[0]?.vehicle.images[0]?.url ?? null} alt="" fill sizes="144px" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate">{o.orderNumber} · {formatDate(o.createdAt)}</p>
                  <p className="mt-1 font-semibold">{o.items[0]?.title}</p>
                  <p className="mt-1 text-sm text-slate">{label("paymentOption", o.paymentOption)} · {formatPrice(Number(o.subtotal))}</p>
                </div>
                <StatusBadge status={o.status} label={label("orderStatus", o.status)} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
