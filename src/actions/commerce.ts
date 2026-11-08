"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { limitByIp } from "@/lib/rate-limit";
import { checkoutSchema, fieldErrors, rentalBookingSchema, type FormState } from "@/lib/validation";
import { createOrder, startPayment, OrderError } from "@/lib/services/orders";
import { createRentalBooking, BookingError, canCustomerCancel } from "@/lib/services/rentals";
import { PaymentGatewayUnavailable } from "@/lib/payments/paystack";
import { notifyAdmins, logActivity } from "@/lib/notify";
import { sendEmail } from "@/lib/email";

export async function checkoutAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Your session has expired. Please sign in again." };
  const limited = await limitByIp("checkout", 10, 10 * 60_000);
  if (limited) return { message: limited };
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please review the highlighted fields." };

  let orderId: string;
  try {
    const order = await createOrder(user.id, parsed.data);
    orderId = order.id;
  } catch (err) {
    if (err instanceof OrderError) return { message: err.message };
    console.error("[checkout]", err);
    return { message: "We couldn't create your order. Please try again." };
  }
  if (parsed.data.paymentOption === "ENQUIRY") redirect(`/dashboard/orders/${orderId}?created=1`);

  let url: string | null = null;
  try {
    url = await startPayment({ kind: "order", id: orderId }, user.id);
  } catch (err) {
    if (!(err instanceof PaymentGatewayUnavailable)) console.error("[checkout:payment]", err);
  }
  // On gateway failure the order remains "Awaiting Payment" and the order page explains the next steps.
  redirect(url ?? `/dashboard/orders/${orderId}?created=1&payment=unavailable`);
}

export async function payAction(kind: "order" | "rental", id: string): Promise<{ ok: boolean; url?: string; message?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };
  const limited = await limitByIp("pay", 10, 10 * 60_000);
  if (limited) return { ok: false, message: limited };
  try {
    return { ok: true, url: await startPayment({ kind, id }, user.id) };
  } catch (err) {
    if (err instanceof OrderError || err instanceof PaymentGatewayUnavailable) return { ok: false, message: err.message };
    console.error("[pay]", err);
    return { ok: false, message: "The payment gateway is unavailable right now. Please try again shortly." };
  }
}

export async function cancelOrderAction(orderId: string, reason?: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };
  const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id } });
  if (!order) return { ok: false, message: "Order not found." };
  if (!["PENDING", "AWAITING_PAYMENT"].includes(order.status)) return { ok: false, message: "This order can no longer be cancelled online. Please contact your advisor." };
  await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason?.slice(0, 500) || "Cancelled by customer", holdExpiresAt: null } });
  await Promise.all([
    logActivity(user.id, "order.cancelled", "Order", order.id, order.orderNumber),
    notifyAdmins({ type: "ORDER", title: "Order cancelled by customer", message: order.orderNumber, link: `/admin/orders?q=${order.orderNumber}` }),
  ]);
  revalidatePath(`/dashboard/orders/${order.id}`);
  revalidatePath("/dashboard/orders");
  return { ok: true, message: "Your order has been cancelled." };
}

export async function bookRentalAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Your session has expired. Please sign in again." };
  const limited = await limitByIp("rental", 10, 10 * 60_000);
  if (limited) return { message: limited };
  const raw = Object.fromEntries(formData);
  const parsed = rentalBookingSchema.safeParse({ ...raw, extras: formData.getAll("extras") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please review the highlighted fields." };
  let bookingId: string;
  try {
    bookingId = (await createRentalBooking(user.id, parsed.data)).id;
  } catch (err) {
    if (err instanceof BookingError) return { message: err.message };
    console.error("[rental]", err);
    return { message: "We couldn't complete your booking. Please try again." };
  }
  redirect(`/dashboard/rentals/${bookingId}?created=1`);
}

export async function cancelRentalAction(bookingId: string, reason?: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };
  const booking = await prisma.rentalBooking.findFirst({ where: { id: bookingId, userId: user.id }, include: { payments: { where: { status: "SUCCESS" } } } });
  if (!booking) return { ok: false, message: "Booking not found." };
  if (!canCustomerCancel(booking)) return { ok: false, message: "This booking can no longer be cancelled online. Please contact concierge." };
  await prisma.rentalBooking.update({ where: { id: booking.id }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason?.slice(0, 500) || "Cancelled by customer" } });
  await Promise.all([
    logActivity(user.id, "rental.cancelled", "RentalBooking", booking.id, booking.bookingNumber),
    notifyAdmins({ type: "RENTAL", title: booking.payments.length ? "Paid booking cancelled — refund due" : "Booking cancelled by customer", message: booking.bookingNumber, link: `/admin/rentals?q=${booking.bookingNumber}` }),
    sendEmail({ to: booking.email, subject: `Booking cancelled — ${booking.bookingNumber}`, heading: "Your booking has been cancelled", lines: [`Booking ${booking.bookingNumber} has been cancelled.`, booking.payments.length ? "Your payment will be refunded to the original payment method within 5–10 business days." : "No payment was taken."] }),
  ]);
  revalidatePath(`/dashboard/rentals/${booking.id}`);
  return { ok: true, message: "Your booking has been cancelled." };
}
