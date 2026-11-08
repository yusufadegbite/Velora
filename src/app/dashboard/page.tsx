import Link from "next/link";
import { ShoppingBag, CalendarRange, Heart, Bell, ArrowRight, Activity } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime, formatPrice, label } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";

export const metadata = { title: "Overview" };

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Signed in", "auth.register": "Created your account", "auth.login_google": "Signed in with Google", "auth.password_changed": "Changed your password", "auth.password_reset": "Reset your password",
  "wishlist.add": "Saved a vehicle", "order.created": "Placed an order", "order.cancelled": "Cancelled an order", "rental.created": "Requested a rental", "rental.cancelled": "Cancelled a rental",
  "payment.success": "Payment confirmed", "enquiry.created": "Sent an enquiry",
};

export default async function Overview({ searchParams }: { searchParams: Promise<{ denied?: string; reset?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [orders, rentals, wishlist, unread, recentOrders, upcoming, activity] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.rentalBooking.count({ where: { userId: user.id, status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] } } }),
    prisma.wishlist.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.order.findMany({ where: { userId: user.id }, include: { items: true }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.rentalBooking.findFirst({ where: { userId: user.id, status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] }, returnAt: { gt: new Date() } }, include: { vehicle: { include: { brand: true } } }, orderBy: { pickupAt: "asc" } }),
    prisma.activityLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  return (
    <div className="space-y-10">
      {sp.denied && <p role="alert" className="border-l-2 border-danger bg-danger/8 px-4 py-3 text-sm text-danger">You don't have permission to view that page.</p>}
      {sp.reset && <p role="status" className="border-l-2 border-success bg-success/8 px-4 py-3 text-sm text-success">Your password has been reset and you're signed in.</p>}
      <div>
        <p className="eyebrow">My account</p>
        <h1 className="display mt-2 text-3xl sm:text-4xl">Good to see you, {user.name.split(" ")[0]}.</h1>
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Orders" value={orders} Icon={ShoppingBag} href="/dashboard/orders" hint="All-time" />
        <StatCard label="Active rentals" value={rentals} Icon={CalendarRange} href="/dashboard/rentals" hint="Pending, confirmed or active" />
        <StatCard label="Wishlist" value={wishlist} Icon={Heart} href="/dashboard/wishlist" hint="Saved vehicles" />
        <StatCard label="Unread" value={unread} Icon={Bell} href="/dashboard/notifications" hint="Notifications" dark />
      </div>

      {upcoming && (
        <Link href={`/dashboard/rentals/${upcoming.id}`} className="group flex flex-col gap-4 bg-midnight p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Upcoming rental · {upcoming.bookingNumber}</p>
            <p className="mt-2 text-xl font-semibold">{upcoming.vehicle.year} {upcoming.vehicle.brand.name} {upcoming.vehicle.model}</p>
            <p className="mt-1 text-sm text-white/60">{formatDateTime(upcoming.pickupAt)} → {formatDateTime(upcoming.returnAt)} · {upcoming.pickupLocation}</p>
          </div>
          <div className="flex items-center gap-4"><StatusBadge status={upcoming.status} label={label("rentalStatus", upcoming.status)} /><ArrowRight className="size-5 text-gold transition-transform group-hover:translate-x-1" /></div>
        </Link>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <section className="border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line p-5"><h2 className="font-semibold">Recent orders</h2><Link href="/dashboard/orders" className="text-xs font-semibold underline-offset-4 hover:underline">View all</Link></div>
          {recentOrders.length ? (
            <ul className="divide-y divide-line">
              {recentOrders.map((o) => (
                <li key={o.id}><Link href={`/dashboard/orders/${o.id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-ivory">
                  <div className="min-w-0"><p className="truncate font-medium">{o.items[0]?.title}</p><p className="text-xs text-slate">{o.orderNumber} · {formatDate(o.createdAt)} · {formatPrice(Number(o.subtotal))}</p></div>
                  <StatusBadge status={o.status} label={label("orderStatus", o.status)} />
                </Link></li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-sm text-slate">No orders yet. <LinkButton href="/cars" variant="link" className="ml-1 font-semibold">Explore vehicles</LinkButton></div>
          )}
        </section>
        <section className="border border-line bg-white">
          <h2 className="flex items-center gap-2 border-b border-line p-5 font-semibold"><Activity className="size-4 text-gold" />Recent activity</h2>
          <ol className="space-y-4 p-5">
            {activity.length === 0 && <li className="text-sm text-slate">Nothing yet.</li>}
            {activity.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
                <div><p>{ACTION_LABELS[a.action] ?? a.action}{a.detail && <span className="text-slate"> · {a.detail}</span>}</p><p className="text-xs text-slate">{formatDateTime(a.createdAt)}</p></div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
