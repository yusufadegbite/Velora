import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/paystack";
import { confirmPayment } from "@/lib/services/orders";

/** Paystack webhook. Signature is verified with HMAC-SHA512 before any processing. */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let event: { event?: string; data?: { reference?: string } };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad payload" }, { status: 400 }); }
  const reference = event.data?.reference;
  if (reference && (event.event === "charge.success" || event.event === "charge.failed")) {
    try {
      // Re-verify with the Paystack API: the webhook body alone is never treated as proof of payment.
      await confirmPayment(reference);
    } catch (err) {
      console.error("[paystack:webhook]", err);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 }); // Paystack retries
    }
  }
  return NextResponse.json({ received: true });
}
