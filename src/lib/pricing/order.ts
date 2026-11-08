import { site } from "@/lib/site";

export type PaymentOptionKey = "FULL_PAYMENT" | "RESERVATION_DEPOSIT" | "ENQUIRY";

/** Which purchase routes are allowed for a given vehicle price. */
export function allowedPaymentOptions(price: number): PaymentOptionKey[] {
  return price <= site.commerce.fullPaymentLimit ? ["FULL_PAYMENT", "RESERVATION_DEPOSIT", "ENQUIRY"] : ["RESERVATION_DEPOSIT", "ENQUIRY"];
}

/** Amount payable online now — computed from the DB price, never from client input. */
export function amountDueNow(price: number, option: PaymentOptionKey) {
  if (option === "FULL_PAYMENT") return price + site.commerce.deliveryFee;
  if (option === "RESERVATION_DEPOSIT") return Math.round(price * site.commerce.depositRate);
  return 0;
}
