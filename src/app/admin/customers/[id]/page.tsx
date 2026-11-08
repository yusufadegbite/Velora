import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatPrice, label } from "@/lib/utils";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { setUserActive, setUserRole } from "@/actions/admin";

export const metadata = { title: "Customer" };

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  const u = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: { include: { items: true }, orderBy: { createdAt: "desc" }, take: 10 },
      rentalBookings: { include: { vehicle: { include: { brand: true } } }, orderBy: { createdAt: "desc" }, take: 10 },
      activities: { orderBy: { createdAt: "desc" }, take: 25 },
      _count: { select: { wishlist: true, comparisons: true, enquiries: true } },
    },
  });
  if (!u) notFound();
  const self = u.id === admin.id;
  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/customers" className="text-xs text-slate hover:text-midnight">← Customers</Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="display text-3xl">{u.name}</h1><p className="mt-1 text-sm text-slate">{u.email}{u.phone && ` · ${u.phone}`} · joined {formatDate(u.createdAt)}</p><div className="mt-2 flex gap-1">{u.role === "ADMIN" ? <Badge tone="dark">Admin</Badge> : <Badge>Customer</Badge>}{!u.isActive && <Badge tone="danger">Suspended</Badge>}</div></div>
          {!self && (
            <div className="flex flex-wrap gap-2">
              {u.isActive
                ? <ConfirmButton action={setUserActive.bind(null, u.id, false)} title="Suspend this account?" description="The customer will be signed out everywhere and unable to sign in until reactivated." confirmLabel="Suspend">Suspend</ConfirmButton>
                : <ConfirmButton action={setUserActive.bind(null, u.id, true)} title="Reactivate this account?" description="The customer will be able to sign in again." confirmLabel="Reactivate">Reactivate</ConfirmButton>}
              {u.role === "CUSTOMER"
                ? <ConfirmButton action={setUserRole.bind(null, u.id, "ADMIN")} title="Grant admin access?" description="Administrators can manage inventory, orders, customers and content." confirmLabel="Make admin">Make admin</ConfirmButton>
                : <ConfirmButton action={setUserRole.bind(null, u.id, "CUSTOMER")} title="Remove admin access?" description="This user will become a regular customer." confirmLabel="Remove admin">Remove admin</ConfirmButton>}
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-slate">{u._count.wishlist} saved vehicles · {u._count.comparisons} saved comparisons · {u._count.enquiries} enquiries</p>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border border-line bg-white"><h2 className="border-b border-line p-5 font-semibold">Orders</h2>
          <ul className="divide-y divide-line">{u.orders.length === 0 && <li className="p-5 text-sm text-slate">None</li>}{u.orders.map((o) => <li key={o.id} className="flex justify-between gap-3 px-5 py-3 text-sm"><Link href={`/admin/orders?q=${o.orderNumber}`} className="min-w-0"><p className="truncate font-medium">{o.items[0]?.title}</p><p className="text-xs text-slate">{o.orderNumber} · {formatPrice(Number(o.subtotal))}</p></Link><StatusBadge status={o.status} label={label("orderStatus", o.status)} /></li>)}</ul>
        </section>
        <section className="border border-line bg-white"><h2 className="border-b border-line p-5 font-semibold">Rental bookings</h2>
          <ul className="divide-y divide-line">{u.rentalBookings.length === 0 && <li className="p-5 text-sm text-slate">None</li>}{u.rentalBookings.map((b) => <li key={b.id} className="flex justify-between gap-3 px-5 py-3 text-sm"><Link href={`/admin/rentals?q=${b.bookingNumber}`}><p className="font-medium">{b.vehicle.brand.name} {b.vehicle.model}</p><p className="text-xs text-slate">{b.bookingNumber} · {formatDate(b.pickupAt)}</p></Link><StatusBadge status={b.status} label={label("rentalStatus", b.status)} /></li>)}</ul>
        </section>
      </div>
      <section className="border border-line bg-white"><h2 className="border-b border-line p-5 font-semibold">Activity log</h2>
        <ol className="divide-y divide-line text-sm">{u.activities.length === 0 && <li className="p-5 text-slate">No activity recorded.</li>}{u.activities.map((a) => <li key={a.id} className="flex justify-between gap-4 px-5 py-2.5"><span><code className="text-xs">{a.action}</code>{a.detail && <span className="text-slate"> · {a.detail}</span>}</span><span className="shrink-0 text-xs text-slate">{formatDateTime(a.createdAt)}</span></li>)}</ol>
      </section>
    </div>
  );
}
