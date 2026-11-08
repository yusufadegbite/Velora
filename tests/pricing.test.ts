import { test } from "node:test";
import assert from "node:assert/strict";
import { rentalCost, rentalDays, quoteRental, toInstant } from "../src/lib/pricing/rental";
import { allowedPaymentOptions, amountDueNow } from "../src/lib/pricing/order";

const rates = { dailyRate: 100_000, weeklyRate: 600_000, monthlyRate: 2_200_000 };

test("rental days round up partial days and reject inverted ranges", () => {
  assert.equal(rentalDays(toInstant("2026-12-01", "10:00"), toInstant("2026-12-04", "10:00")), 3);
  assert.equal(rentalDays(new Date("2026-12-01T10:00:00Z"), new Date("2026-12-01T11:00:00Z")), 1);
  assert.equal(rentalDays(toInstant("2026-12-04", "10:00"), toInstant("2026-12-01", "10:00")), 0);
});

test("toInstant interprets times in Lagos (UTC+1)", () => {
  assert.equal(toInstant("2026-12-01", "10:00").toISOString(), "2026-12-01T09:00:00.000Z");
});

test("daily, weekly and monthly tiers use the cheapest combination", () => {
  assert.deepEqual(rentalCost(3, rates), { cost: 300_000, rateType: "DAILY" });
  assert.equal(rentalCost(7, rates).cost, 600_000);
  assert.equal(rentalCost(7, rates).rateType, "WEEKLY");
  assert.equal(rentalCost(6, rates).cost, 600_000); // 6 daily days (600k) == weekly cap
  assert.equal(rentalCost(9, rates).cost, 800_000); // 1 week + 2 days
  assert.equal(rentalCost(30, rates).cost, 2_200_000);
  assert.equal(rentalCost(30, rates).rateType, "MONTHLY");
  assert.equal(rentalCost(28, rates).cost, 2_200_000); // 4 weeks = 2.4M → capped at monthly
});

test("missing weekly/monthly rates fall back to multiples of daily", () => {
  assert.equal(rentalCost(7, { dailyRate: 50_000, weeklyRate: null, monthlyRate: null }).cost, 350_000);
});

test("extras are priced per day or flat, and unknown codes are ignored", () => {
  const q = quoteRental({ pickupAt: toInstant("2026-12-01", "10:00"), returnAt: toInstant("2026-12-04", "10:00"), rates, extras: ["CHAUFFEUR", "DELIVERY", "HACKED_FREE_CAR"], securityDeposit: 500_000 });
  assert.equal(q.days, 3);
  assert.equal(q.extrasCost, 45_000 * 3 + 35_000);
  assert.deepEqual(q.validExtras.sort(), ["CHAUFFEUR", "DELIVERY"]);
  assert.equal(q.total, 300_000 + 170_000);
  assert.equal(q.securityDeposit, 500_000);
});

test("purchase options depend on price and deposits are computed server-side", () => {
  assert.deepEqual(allowedPaymentOptions(40_000_000), ["FULL_PAYMENT", "RESERVATION_DEPOSIT", "ENQUIRY"]);
  assert.deepEqual(allowedPaymentOptions(400_000_000), ["RESERVATION_DEPOSIT", "ENQUIRY"]);
  assert.equal(amountDueNow(485_000_000, "RESERVATION_DEPOSIT"), 48_500_000);
  assert.equal(amountDueNow(40_000_000, "FULL_PAYMENT"), 40_000_000);
  assert.equal(amountDueNow(40_000_000, "ENQUIRY"), 0);
});
