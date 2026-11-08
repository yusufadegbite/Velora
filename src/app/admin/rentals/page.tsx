import type { Prisma, RentalStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { adminPaging } from "@/lib/admin";
import { formatDate, formatDateTime, formatPrice, label, LABELS } from "@/lib/utils";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { StatusControl } from "@/components/admin/StatusControl";
import { ActionButton } from "@/components/admin/ActionButton";
import { BlockForm } from "@/components/admin/BlockForm";
import { StatusBadge } from "@/components/ui/Badge";
import { removeAvailabilityBlock, updateRentalStatus } from "@/actions/admin";

export const metadata = { title: "Rentals" };

const NEXT: Record<RentalStatus, { value: RentalStatus; label: string; destructive?: boolean }[]> = {
  PENDING: [{ value: "CONFIRMED", label: "Approve" }, { value: "REJECTED", label: "Reject", destructive: true }],
  CONFIRMED: [{ value: "ACTIVE", label: "Mark picked up" }, { value: "CANCELLED", label: "Cancel", destructive: true }],
  ACTIVE: [{ value: "COMPLETED", label: "Mark returned" }],
  COMPLETED: [], CANCELLED: [], REJECTED: [],
};

export default async function AdminRentals({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { page, q, skip, take, str, pages } = adminPaging(sp);
  const status = str("status");
  const where: Prisma.RentalBookingWhereInput = {
    ...(q ? { OR: [{ bookingNumber: { contains: q, mode: "insensitive" } }, { customerName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { vehicle: { model: { contains: q, mode: "insensitive" } } }] } : {}),
    ...(status in LABELS.rentalStatus ? { status: status as RentalStatus } : {}),
  };
  const [total, bookings, fleet, blocks] = await Promise.all([
    prisma.rentalBooking.count({ where }),
    prisma.rentalBooking.findMany({ where, include: { vehicle: { include: { brand: true } }, payments: { where: { status: "SUCCESS" } } }, orderBy: [{ status: "asc" }, { pickupAt: "asc" }], skip, take }),
    prisma.vehicle.findMany({ where: { forRent: true, status: { not: "ARCHIVED" } }, include: { brand: true }, orderBy: { model: "asc" } }),
    prisma.rentalAvailability.findMany({ where: { endsAt: { gt: new Date() } }, include: { vehicle: { include: { brand: true } } }, orderBy: { startsAt: "asc" } }),
  ]);
  const rows = bookings.map((b) => ({
    id: b.id,
    cells: {
      booking: <div><p className="font-semibold">{b.bookingNumber}</p><p className="text-xs text-slate">Requested {formatDate(b.createdAt)}</p></div>,
      vehicle: <p>{b.vehicle.year} {b.vehicle.brand.name} {b.vehicle.model}</p>,
      customer: <div><p className="font-medium">{b.customerName}</p><p className="text-xs text-slate">{b.phone} · Lic. {b.driverLicense}</p></div>,
      dates: <div className="text-xs"><p>{formatDateTime(b.pickupAt)}</p><p className="text-slate">→ {formatDateTime(b.returnAt)} ({b.days}d)</p><p className="text-slate">{b.pickupLocation}</p></div>,
      total: <div className="tabular-nums"><p className="font-semibold">{formatPrice(Number(b.total))}</p><p className="text-xs text-slate">{b.payments.length ? "Paid online" : "Unpaid"}</p></div>,
      status: <StatusBadge status={b.status} label={label("rentalStatus", b.status)} />,
      actions: <StatusControl entityLabel={b.bookingNumber} action={updateRentalStatus.bind(null, b.id) as (s: string, n?: string) => Promise<{ ok: boolean; message: string }>} options={NEXT[b.status]} />,
    },
  }));
  return (
    <div className="space-y-10">
      <div>
        <div className="mb-6"><h1 className="display text-3xl">Rental bookings</h1><p className="mt-1 text-sm text-slate">Approve or reject requests and update booking progress. Overlapping bookings are blocked by the database.</p></div>
        <AdminDataTable basePath="/admin/rentals" params={sp} page={page} pages={pages(total)} total={total} searchPlaceholder="Booking number, customer, vehicle…"
          filters={[{ name: "status", label: "Status", options: Object.entries(LABELS.rentalStatus) }]}
          columns={[{ key: "booking", header: "Booking" }, { key: "vehicle", header: "Vehicle" }, { key: "customer", header: "Driver" }, { key: "dates", header: "Dates" }, { key: "total", header: "Total" }, { key: "status", header: "Status" }, { key: "actions", header: "Update" }]}
          rows={rows} />
      </div>
      <section className="border border-line bg-white p-5">
        <h2 className="font-semibold">Rental availability</h2>
        <p className="mt-1 mb-5 text-sm text-slate">Block dates for maintenance or private use. Customers can&apos;t book over blocked periods.</p>
        <BlockForm vehicles={fleet.map((v) => ({ id: v.id, name: `${v.year} ${v.brand.name} ${v.model}` }))} />
        <ul className="mt-6 divide-y divide-line border-t border-line text-sm">
          {blocks.length === 0 && <li className="py-4 text-slate">No upcoming blocks.</li>}
          {blocks.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span><strong>{b.vehicle.brand.name} {b.vehicle.model}</strong> · {formatDateTime(b.startsAt)} → {formatDateTime(b.endsAt)} · <span className="text-slate">{b.type.replace("_", " ").toLowerCase()}{b.reason && ` — ${b.reason}`}</span></span>
              <ActionButton action={removeAvailabilityBlock.bind(null, b.id)} className="text-danger">Remove</ActionButton>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
