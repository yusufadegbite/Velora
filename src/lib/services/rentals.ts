import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { site } from "@/lib/site";
import { quoteRental, toInstant } from "@/lib/pricing/rental";
import { randomCode, formatPrice, formatDateTime } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { notify, notifyAdmins, logActivity } from "@/lib/notify";
import { env } from "@/lib/env";
import type { z } from "zod";
import type { rentalBookingSchema } from "@/lib/validation";

export const ACTIVE_RENTAL_STATUSES = ["PENDING", "CONFIRMED", "ACTIVE"] as const;

export class BookingError extends Error {}

/** Upcoming unavailable ranges for a vehicle (bookings + admin blocks), used for the UI. */
export async function getUnavailableRanges(vehicleId: string) {
  const now = new Date();
  const [bookings, blocks] = await Promise.all([
    prisma.rentalBooking.findMany({
      where: { vehicleId, status: { in: [...ACTIVE_RENTAL_STATUSES] }, returnAt: { gt: now } },
      select: { pickupAt: true, returnAt: true },
      orderBy: { pickupAt: "asc" },
      take: 20,
    }),
    prisma.rentalAvailability.findMany({
      where: { vehicleId, endsAt: { gt: now } },
      select: { startsAt: true, endsAt: true, type: true },
      orderBy: { startsAt: "asc" },
      take: 20,
    }),
  ]);
  return [
    ...bookings.map((b) => ({ start: b.pickupAt.toISOString(), end: b.returnAt.toISOString(), kind: "Booked" })),
    ...blocks.map((b) => ({ start: b.startsAt.toISOString(), end: b.endsAt.toISOString(), kind: b.type === "MAINTENANCE" ? "Maintenance" : "Unavailable" })),
  ].sort((a, b) => a.start.localeCompare(b.start));
}

type BookingInput = z.infer<typeof rentalBookingSchema>;

/**
 * Creates a rental booking. Concurrency safety:
 *  1. The vehicle row is locked (SELECT … FOR UPDATE) so concurrent bookings for the same car serialise.
 *  2. Overlaps with active bookings and admin blocks are checked inside the transaction.
 *  3. A PostgreSQL exclusion constraint (RentalBooking_no_overlap) is the final guarantee.
 */
export async function createRentalBooking(userId: string, input: BookingInput) {
  const pickupAt = toInstant(input.pickupDate, input.pickupTime);
  const returnAt = toInstant(input.returnDate, input.pickupTime);
  if (Number.isNaN(pickupAt.getTime()) || Number.isNaN(returnAt.getTime())) throw new BookingError("Please choose valid dates.");
  if (pickupAt.getTime() < Date.now() + 2 * 3600_000) throw new BookingError("Pickup must be at least 2 hours from now.");
  if (returnAt <= pickupAt) throw new BookingError("Return date must be after the pickup date.");

  try {
    const booking = await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${input.vehicleId} FOR UPDATE`;
        const vehicle = await tx.vehicle.findUnique({ where: { id: input.vehicleId }, include: { brand: true } });
        if (!vehicle || !vehicle.forRent || vehicle.status !== "AVAILABLE" || !vehicle.dailyRate) {
          throw new BookingError("This vehicle is not currently available for rental.");
        }
        const quote = quoteRental({
          pickupAt,
          returnAt,
          rates: { dailyRate: Number(vehicle.dailyRate), weeklyRate: vehicle.weeklyRate ? Number(vehicle.weeklyRate) : null, monthlyRate: vehicle.monthlyRate ? Number(vehicle.monthlyRate) : null },
          extras: input.extras,
          securityDeposit: Number(vehicle.securityDeposit ?? 0),
        });
        if (quote.days < site.rental.minDays || quote.days > site.rental.maxDays) {
          throw new BookingError(`Rentals must be between ${site.rental.minDays} and ${site.rental.maxDays} days.`);
        }
        const clash = await tx.rentalBooking.findFirst({
          where: { vehicleId: vehicle.id, status: { in: [...ACTIVE_RENTAL_STATUSES] }, pickupAt: { lt: returnAt }, returnAt: { gt: pickupAt } },
          select: { id: true },
        });
        if (clash) throw new BookingError("Those dates overlap an existing booking. Please choose different dates.");
        const block = await tx.rentalAvailability.findFirst({
          where: { vehicleId: vehicle.id, startsAt: { lt: returnAt }, endsAt: { gt: pickupAt } },
          select: { id: true },
        });
        if (block) throw new BookingError("The vehicle is unavailable for part of that period. Please choose different dates.");

        const created = await tx.rentalBooking.create({
          data: {
            bookingNumber: `VR-${randomCode(7)}`,
            userId,
            vehicleId: vehicle.id,
            pickupLocation: input.pickupLocation,
            returnLocation: input.returnLocation,
            pickupAt,
            returnAt,
            days: quote.days,
            rateType: quote.rateType,
            rentalCost: quote.rentalCost,
            extrasCost: quote.extrasCost,
            securityDeposit: quote.securityDeposit,
            total: quote.total,
            extras: quote.validExtras,
            customerName: input.customerName,
            email: input.email,
            phone: input.phone,
            driverLicense: input.driverLicense,
            notes: input.notes || null,
          },
        });
        return { ...created, vehicleName: `${vehicle.year} ${vehicle.brand.name} ${vehicle.model}` };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10_000 },
    );

    await Promise.all([
      notify(userId, { type: "RENTAL", title: "Booking request received", message: `${booking.vehicleName} · ${booking.bookingNumber} is awaiting confirmation.`, link: `/dashboard/rentals/${booking.id}` }),
      notifyAdmins({ type: "RENTAL", title: "New rental booking", message: `${booking.bookingNumber} — ${booking.vehicleName}`, link: `/admin/rentals?q=${booking.bookingNumber}` }),
      logActivity(userId, "rental.created", "RentalBooking", booking.id, booking.bookingNumber),
      sendEmail({
        to: booking.email,
        subject: `Booking received — ${booking.bookingNumber}`,
        heading: "We've received your booking request",
        lines: [
          `Hello ${booking.customerName}, thank you for choosing VELORA.`,
          `${booking.vehicleName} from ${formatDateTime(booking.pickupAt)} to ${formatDateTime(booking.returnAt)} (${booking.days} day${booking.days > 1 ? "s" : ""}).`,
          `Estimated total: ${formatPrice(Number(booking.total))}. Refundable security deposit: ${formatPrice(Number(booking.securityDeposit))}.`,
          "Our concierge team will confirm availability and contact you shortly.",
        ],
        cta: { label: "View booking", href: `${env.appUrl}/dashboard/rentals/${booking.id}` },
      }),
    ]);
    return booking;
  } catch (err) {
    if (err instanceof BookingError) throw err;
    if (String((err as Error)?.message ?? "").includes("RentalBooking_no_overlap")) {
      throw new BookingError("Someone just booked those dates. Please choose different dates.");
    }
    throw err;
  }
}

export function canCustomerCancel(b: { status: string; pickupAt: Date }) {
  return (b.status === "PENDING" || b.status === "CONFIRMED") && b.pickupAt.getTime() - Date.now() > site.rental.cancellationHours * 3600_000;
}
