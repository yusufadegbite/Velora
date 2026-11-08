import "server-only";
import { createHmac } from "node:crypto";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/auth/tokens";

/**
 * Paystack integration (https://paystack.com/docs/api).
 * - initialize(): server-side creation of a transaction for an amount computed by the server.
 * - verify(): server-side confirmation — the only source of truth for payment success.
 * - verifyWebhookSignature(): HMAC-SHA512 check of the x-paystack-signature header.
 */
const BASE = "https://api.paystack.co";

export class PaymentGatewayUnavailable extends Error {
  constructor() {
    super("Online payment is not configured. Set PAYSTACK_SECRET_KEY to enable it.");
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  if (!env.paystack.enabled) throw new PaymentGatewayUnavailable();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.paystack.secretKey}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || !json.status || !json.data) throw new Error(json.message ?? `Paystack request failed (${res.status})`);
  return json.data;
}

/** Amount in major units (e.g. Naira). Paystack expects the subunit (kobo). */
export const toSubunit = (amount: number) => Math.round(amount * 100);

export function initializeTransaction(input: { email: string; amount: number; reference: string; callbackUrl: string; metadata: Record<string, unknown> }) {
  return call<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: toSubunit(input.amount),
      currency: env.paystack.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
}

export type PaystackVerification = {
  status: "success" | "failed" | "abandoned" | "ongoing" | "pending" | "reversed" | string;
  reference: string;
  amount: number;
  currency: string;
  channel?: string;
  gateway_response?: string;
  paid_at?: string | null;
};

export const verifyTransaction = (reference: string) => call<PaystackVerification>(`/transaction/verify/${encodeURIComponent(reference)}`);

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature || !env.paystack.secretKey) return false;
  const expected = createHmac("sha512", env.paystack.secretKey).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
