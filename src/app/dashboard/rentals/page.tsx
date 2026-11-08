import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDateTime, formatPrice, label } from "@/lib/utils";
import { DashHeader } from "@/components/dashboard/DashHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { VehicleImage } from "@/components/ui/VehicleImage";

export const metadata = { title: "My Rentals" };

export default async function RentalsPage() {
  const user = await requireUser();
  const bookings = await prisma.rentalBooking.findMany({
    where: { userId: user.id },
    include: { vehicle: { select: { year: true, model: true, brand: { select: { name: true } }, images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } } } },
    orderBy: { pickupAt: "desc" },
  });
  return (
    <>
      <DashHeader title="My Rental Bookings" description="Track status, pay and manage your bookings." action={<LinkButton href="/rentals" size="sm" variant="dark">New booking</LinkButton>} />
      {bookings.length === 0 ? (
        <EmptyState icon={CalendarRange} title="No rental bookings yet" description="Book a car for a day, a week or a month. Your bookings and their status will appear here." action={<LinkButton href="/rentals">Browse the rental fleet</LinkButton>} />
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link href={`/dashboard/rentals/${b.id}`} className="flex flex-col gap-4 border border-line bg-white p-4 transition hover:border-midnight/30 sm:flex-row sm:items-center">
                <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-midnight sm:w-36"><VehicleImage src={b.vehicle.images[0]?.url ?? null} alt="" fill sizes="144px" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate">{b.bookingNumber} · {b.days} day{b.days > 1 && "s"}</p>
                  <p className="mt-1 font-semibold">{b.vehicle.year} {b.vehicle.brand.name} {b.vehicle.model}</p>
                  <p className="mt-1 text-sm text-slate">{formatDateTime(b.pickupAt)} → {formatDateTime(b.returnAt)} · {formatPrice(Number(b.total))}</p>
                </div>
                <StatusBadge status={b.status} label={label("rentalStatus", b.status)} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
