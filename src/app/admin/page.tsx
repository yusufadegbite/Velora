import Link from "next/link";
import { Car, CheckCircle2, BadgeDollarSign, CalendarRange, ShoppingBag, Wallet, Users, Inbox } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCompactPrice, formatDate, formatPrice, label } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart, StatusBarChart } from "@/components/admin/Charts";
import { StatusBadge } from "@/components/ui/Badge";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const since = new Date(); since.setMonth(since.getMonth() - 5); since.setDate(1); since.setHours(0, 0, 0, 0);
  const [total, available, sold, activeRentals, orders, customers, newEnquiries, revenueAgg, payments, ordersByStatus, recentOrders, pendingRentals] = await Promise.all([
    prisma.vehicle.count({ where: { status: { not: "ARCHIVED" } } }),
    prisma.vehicle.count({ where: { status: "AVAILABLE" } }),
    prisma.vehicle.count({ where: { status: "SOLD" } }),
    prisma.rentalBooking.count({ where: { status: { in: ["CONFIRMED", "ACTIVE"] } } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.contactEnquiry.count({ where: { status: "NEW" } }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.payment.findMany({ where: { status: "SUCCESS", paidAt: { gte: since } }, select: { amount: true, paidAt: true } }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.rentalBooking.findMany({ where: { status: "PENDING" }, include: { vehicle: { include: { brand: true } } }, orderBy: { pickupAt: "asc" }, take: 5 }),
  ]);
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(since); d.setMonth(since.getMonth() + i); return d; });
  const revenue = months.map((m) => ({
    month: m.toLocaleString("en-NG", { month: "short" }),
    revenue: payments.filter((p) => p.paidAt && p.paidAt.getMonth() === m.getMonth() && p.paidAt.getFullYear() === m.getFullYear()).reduce((s, p) => s + Number(p.amount), 0),
  }));
  const statusData = ordersByStatus.map((s) => ({ label: label("orderStatus", s.status), count: s._count }));
  const totalRevenue = Number(revenueAgg._sum.amount ?? 0);

  return (
    <div className="space-y-8">
      <div><p className="eyebrow">Admin console</p><h1 className="display mt-2 text-3xl">Business overview</h1></div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total vehicles" value={total} Icon={Car} href="/admin/vehicles" />
        <StatCard label="Available" value={available} Icon={CheckCircle2} href="/admin/vehicles?status=AVAILABLE" />
        <StatCard label="Sold" value={sold} Icon={BadgeDollarSign} href="/admin/vehicles?status=SOLD" />
        <StatCard label="Active rentals" value={activeRentals} Icon={CalendarRange} href="/admin/rentals" />
        <StatCard label="Total orders" value={orders} Icon={ShoppingBag} href="/admin/orders" />
        <StatCard label="Revenue collected" value={formatCompactPrice(totalRevenue)} Icon={Wallet} hint="Verified payments" dark />
        <StatCard label="Customers" value={customers} Icon={Users} href="/admin/customers" />
        <StatCard label="New enquiries" value={newEnquiries} Icon={Inbox} href="/admin/enquiries" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="border border-line bg-white p-5"><h2 className="mb-4 font-semibold">Revenue — last 6 months</h2><RevenueChart data={revenue} /></section>
        <section className="border border-line bg-white p-5"><h2 className="mb-4 font-semibold">Orders by status</h2>{statusData.length ? <StatusBarChart data={statusData} /> : <p className="text-sm text-slate">No orders yet.</p>}</section>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border border-line bg-white">
          <div className="flex justify-between border-b border-line p-5"><h2 className="font-semibold">Recent orders</h2><Link href="/admin/orders" className="text-xs font-semibold underline">All orders</Link></div>
          <ul className="divide-y divide-line">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                <div className="min-w-0"><p className="truncate font-medium">{o.items[0]?.title}</p><p className="text-xs text-slate">{o.orderNumber} · {o.customerName} · {formatDate(o.createdAt)}</p></div>
                <div className="text-right"><p className="font-semibold tabular-nums">{formatPrice(Number(o.subtotal))}</p><StatusBadge status={o.status} label={label("orderStatus", o.status)} /></div>
              </li>
            ))}
          </ul>
        </section>
        <section className="border border-line bg-white">
          <div className="flex justify-between border-b border-line p-5"><h2 className="font-semibold">Rentals awaiting approval</h2><Link href="/admin/rentals?status=PENDING" className="text-xs font-semibold underline">Review</Link></div>
          {pendingRentals.length === 0 ? <p className="p-5 text-sm text-slate">Nothing waiting. 🎉</p> : (
            <ul className="divide-y divide-line">
              {pendingRentals.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                  <div className="min-w-0"><p className="truncate font-medium">{b.vehicle.brand.name} {b.vehicle.model}</p><p className="text-xs text-slate">{b.bookingNumber} · {b.customerName} · from {formatDate(b.pickupAt)}</p></div>
                  <Link href={`/admin/rentals?q=${b.bookingNumber}`} className="text-xs font-semibold text-gold-dark">Review →</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
