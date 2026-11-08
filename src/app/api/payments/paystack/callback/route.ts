import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { confirmPayment } from "@/lib/services/orders";

/** Browser returns here from Paystack. We verify server-side, never trusting query params. */
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference") ?? req.nextUrl.searchParams.get("trxref");
  if (!reference || reference.length > 100) return NextResponse.redirect(new URL("/dashboard/orders", env.appUrl));
  const payment = await prisma.payment.findUnique({ where: { reference }, select: { orderId: true, rentalBookingId: true } });
  if (!payment) return NextResponse.redirect(new URL("/dashboard/orders", env.appUrl));
  let status = "pending";
  try {
    status = (await confirmPayment(reference)).status;
  } catch (err) {
    console.error("[paystack:callback]", err);
    status = "error";
  }
  const base = payment.orderId ? `/dashboard/orders/${payment.orderId}` : `/dashboard/rentals/${payment.rentalBookingId}`;
  return NextResponse.redirect(new URL(`${base}?payment=${status}`, env.appUrl));
}
