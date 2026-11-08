/**
 * Integration test against the real database: fires concurrent overlapping bookings
 * and asserts that exactly one succeeds (row lock + exclusion constraint).
 * Requires DATABASE_URL and a seeded database.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

test("concurrent overlapping rental bookings: only one is accepted", async () => {
  const vehicle = await prisma.vehicle.findFirst({ where: { forRent: true, status: "AVAILABLE" } });
  const user = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
  assert.ok(vehicle && user, "seed data required");
  const pickupAt = new Date(Date.now() + 400 * 86_400_000);
  const returnAt = new Date(pickupAt.getTime() + 3 * 86_400_000);

  const attempt = (n: number) =>
    prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${vehicle!.id} FOR UPDATE`;
      const clash = await tx.rentalBooking.findFirst({ where: { vehicleId: vehicle!.id, status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] }, pickupAt: { lt: returnAt }, returnAt: { gt: pickupAt } } });
      if (clash) throw new Error("overlap");
      return tx.rentalBooking.create({ data: { bookingNumber: `VR-TEST-${Date.now()}-${n}`, userId: user!.id, vehicleId: vehicle!.id, pickupLocation: "x", returnLocation: "x", pickupAt, returnAt, days: 3, rateType: "DAILY", rentalCost: 1, extrasCost: 0, securityDeposit: 0, total: 1, extras: [], customerName: "t", email: "t@t.co", phone: "1", driverLicense: "x" } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });

  try {
    const results = await Promise.allSettled(Array.from({ length: 8 }, (_, i) => attempt(i)));
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  } finally {
    await prisma.rentalBooking.deleteMany({ where: { bookingNumber: { startsWith: "VR-TEST-" } } });
  }
});

test("the exclusion constraint rejects overlaps even without the application check", async () => {
  const vehicle = await prisma.vehicle.findFirst({ where: { forRent: true } });
  const user = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
  const pickupAt = new Date(Date.now() + 500 * 86_400_000);
  const mk = (n: string, start: Date, days: number) => prisma.rentalBooking.create({ data: { bookingNumber: `VR-TEST-${n}`, userId: user!.id, vehicleId: vehicle!.id, pickupLocation: "x", returnLocation: "x", pickupAt: start, returnAt: new Date(start.getTime() + days * 86_400_000), days, rateType: "DAILY", rentalCost: 1, extrasCost: 0, securityDeposit: 0, total: 1, extras: [], customerName: "t", email: "t@t.co", phone: "1", driverLicense: "x" } });
  try {
    await mk("A", pickupAt, 3);
    await assert.rejects(mk("B", new Date(pickupAt.getTime() + 86_400_000), 3), /RentalBooking_no_overlap|exclusion/i);
    // Back-to-back bookings ([) range) are allowed.
    await mk("C", new Date(pickupAt.getTime() + 3 * 86_400_000), 2);
  } finally {
    await prisma.rentalBooking.deleteMany({ where: { bookingNumber: { startsWith: "VR-TEST-" } } });
    await prisma.$disconnect();
  }
});
