import { site } from "@/lib/site";

/** Pure rental pricing — used by the booking form for estimates and by the server as the source of truth. */
export const LAGOS_OFFSET = "+01:00";
const DAY_MS = 86_400_000;

export type RentalRates = { dailyRate: number; weeklyRate: number | null; monthlyRate: number | null };

export function toInstant(date: string, time: string) {
  return new Date(`${date}T${time}:00${LAGOS_OFFSET}`);
}

export function rentalDays(pickupAt: Date, returnAt: Date) {
  const diff = returnAt.getTime() - pickupAt.getTime();
  if (!Number.isFinite(diff) || diff <= 0) return 0;
  return Math.ceil(diff / DAY_MS);
}

/** Cheapest combination of monthly, weekly and daily tiers. */
export function rentalCost(days: number, rates: RentalRates) {
  const daily = rates.dailyRate;
  const weekly = rates.weeklyRate ?? daily * 7;
  const monthly = rates.monthlyRate ?? weekly * 4 + daily * 2;
  const months = Math.floor(days / 30);
  const afterMonths = days - months * 30;
  const weeks = Math.floor(afterMonths / 7);
  const rem = afterMonths - weeks * 7;
  const remCost = Math.min(rem * daily, rem > 0 ? weekly : 0);
  const weeksCost = Math.min(weeks * weekly + remCost, afterMonths > 0 ? monthly : 0);
  const cost = months * monthly + weeksCost;
  const rateType = months > 0 || (afterMonths > 0 && weeksCost === monthly && weeks * weekly + remCost > monthly) ? "MONTHLY" : weeks > 0 || (rem > 0 && remCost === weekly && rem * daily > weekly) ? "WEEKLY" : "DAILY";
  return { cost, rateType };
}

export function extrasCost(codes: string[], days: number) {
  const items = site.rental.extras.filter((e) => codes.includes(e.code));
  const lines = items.map((e) => ({ code: e.code, label: e.label, amount: e.pricing === "PER_DAY" ? e.amount * days : e.amount }));
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0), validCodes: items.map((i) => i.code) };
}

export function quoteRental(input: { pickupAt: Date; returnAt: Date; rates: RentalRates; extras: string[]; securityDeposit: number }) {
  const days = rentalDays(input.pickupAt, input.returnAt);
  const { cost, rateType } = rentalCost(days, input.rates);
  const extras = extrasCost(input.extras, days);
  return {
    days,
    rateType,
    rentalCost: cost,
    extrasCost: extras.total,
    extraLines: extras.lines,
    validExtras: extras.validCodes,
    securityDeposit: input.securityDeposit,
    total: cost + extras.total,
  };
}
