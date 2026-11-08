import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { adminPaging } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Customers" };

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { page, q, skip, take, str, pages } = adminPaging(sp);
  const role = str("role"), state = str("state");
  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
    ...(role === "ADMIN" || role === "CUSTOMER" ? { role } : {}),
    ...(state === "active" ? { isActive: true } : state === "suspended" ? { isActive: false } : {}),
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, include: { _count: { select: { orders: true, rentalBookings: true, wishlist: true } } }, orderBy: { createdAt: "desc" }, skip, take }),
  ]);
  const rows = users.map((u) => ({
    id: u.id,
    cells: {
      user: <div><Link href={`/admin/customers/${u.id}`} className="font-semibold hover:underline">{u.name}</Link><p className="text-xs text-slate">{u.email}{u.phone && ` · ${u.phone}`}</p></div>,
      role: <div className="flex gap-1">{u.role === "ADMIN" ? <Badge tone="dark">Admin</Badge> : <Badge>Customer</Badge>}{!u.isActive && <Badge tone="danger">Suspended</Badge>}{u.googleId && <Badge tone="neutral">Google</Badge>}</div>,
      activity: <p className="text-xs text-slate">{u._count.orders} orders · {u._count.rentalBookings} rentals · {u._count.wishlist} saved</p>,
      joined: <span className="text-slate">{formatDate(u.createdAt)}</span>,
      last: <span className="text-slate">{u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}</span>,
      view: <Link href={`/admin/customers/${u.id}`} className="text-xs font-semibold underline-offset-4 hover:underline">Manage</Link>,
    },
  }));
  return (
    <>
      <div className="mb-6"><h1 className="display text-3xl">Customers</h1><p className="mt-1 text-sm text-slate">Registered accounts, roles and activity.</p></div>
      <AdminDataTable basePath="/admin/customers" params={sp} page={page} pages={pages(total)} total={total} searchPlaceholder="Name, email or phone…"
        filters={[{ name: "role", label: "Role", options: [["CUSTOMER", "Customer"], ["ADMIN", "Admin"]] }, { name: "state", label: "State", options: [["active", "Active"], ["suspended", "Suspended"]] }]}
        columns={[{ key: "user", header: "Customer" }, { key: "role", header: "Role" }, { key: "activity", header: "Activity" }, { key: "joined", header: "Joined" }, { key: "last", header: "Last sign-in" }, { key: "view", header: "", className: "text-right" }]}
        rows={rows} />
    </>
  );
}
