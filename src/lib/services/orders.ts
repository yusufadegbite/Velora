import "server-only";
import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { site } from "@/lib/site";
import { allowedPaymentOptions, amountDueNow } from "@/lib/pricing/order";
import { formatPrice, randomCode, label } from "@/lib/utils";
import type { checkoutSchema } from "@/lib/validation";
import { sendEmail } from "@/lib/email";
import { notify, notifyAdmins, logActivity } from "@/lib/notify";
import { initializeTransaction, verifyTransaction, toSubunit, PaymentGatewayUnavailable } from "@/lib/payments/paystack";

export class OrderError extends Error {}

const BLOCKING_STATUSES = ["PAYMENT_CONFIRMED", "PROCESSING", "COMPLETED"] as const;

/** Another customer's live hold or confirmed order on this vehicle? */
async function vehicleHeldByOther(tx: Prisma.TransactionClient, vehicleId: string, userId: string) {
  const other = await tx.order.findFirst({
    where: {
      userId: { not: userId },
      items: { some: { vehicleId } },
      OR: [{ status: { in: [...BLOCKING_STATUSES] } }, { status: "AWAITING_PAYMENT", holdExpiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  });
  return Boolean(other);
}

type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Creates an order inside a transaction with the vehicle row locked. Prices come only from the DB. */
export async function createOrder(userId: string, input: CheckoutInput) {
  const order = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${input.vehicleId} FOR UPDATE`;
      const vehicle = await tx.vehicle.findUnique({ where: { id: input.vehicleId }, include: { brand: true } });
      if (!vehicle || !vehicle.forSale || vehicle.status !== "AVAILABLE") throw new OrderError("This vehicle is no longer available for purchase.");
      const price = Number(vehicle.price);
      if (!allowedPaymentOptions(price).includes(input.paymentOption)) throw new OrderError("That payment option isn't available for this vehicle.");
      if (input.paymentOption !== "ENQUIRY" && (await vehicleHeldByOther(tx, vehicle.id, userId))) {
        throw new OrderError("Another customer is completing a reservation for this vehicle. Please check back shortly or send an enquiry.");
      }
      const title = `${vehicle.year} ${vehicle.brand.name} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`;
      const isEnquiry = input.paymentOption === "ENQUIRY";
      return tx.order.create({
        data: {
          orderNumber: `VO-${randomCode(8)}`,
          userId,
          status: isEnquiry ? "PENDING" : "AWAITING_PAYMENT",
          paymentOption: input.paymentOption,
          subtotal: price,
          amountDue: amountDueNow(price, input.paymentOption),
          currency: site.currency,
          customerName: input.customerName,
          email: input.email,
          phone: input.phone,
          fulfilment: input.fulfilment,
          deliveryAddress: input.fulfilment === "DELIVERY" ? input.deliveryAddress || null : null,
          city: input.fulfilment === "DELIVERY" ? input.city || null : null,
          state: input.fulfilment === "DELIVERY" ? input.state || null : null,
          billingName: input.billingName,
          billingAddress: input.billingAddress,
          notes: input.notes || null,
          holdExpiresAt: isEnquiry ? null : new Date(Date.now() + site.commerce.orderHoldMinutes * 60_000),
          items: { create: { vehicleId: vehicle.id, title, unitPrice: price } },
        },
        include: { items: true },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10_000 },
  );

  const title = order.items[0].title;
  await Promise.all([
    notify(userId, { type: "ORDER", title: "Order created", message: `${order.orderNumber} — ${title}`, link: `/dashboard/orders/${order.id}` }),
    notifyAdmins({ type: "ORDER", title: `New ${label("paymentOption", order.paymentOption).toLowerCase()}`, message: `${order.orderNumber} — ${title}`, link: `/admin/orders?q=${order.orderNumber}` }),
    logActivity(userId, "order.created", "Order", order.id, order.orderNumber),
    sendEmail({
      to: order.email,
      subject: `Your VELORA order ${order.orderNumber}`,
      heading: order.paymentOption === "ENQUIRY" ? "Your purchase enquiry is with our team" : "Your order has been created",
      lines: [
        `Hello ${order.customerName},`,
        `Vehicle: ${title} — ${formatPrice(Number(order.subtotal))}.`,
        order.paymentOption === "ENQUIRY"
          ? "A VELORA sales advisor will contact you within one business day to arrange inspection, financing and payment."
          : `Amount payable now: ${formatPrice(Number(order.amountDue))}. Your reservation is held for ${site.commerce.orderHoldMinutes} minutes while you complete payment.`,
      ],
      cta: { label: "View order", href: `${env.appUrl}/dashboard/orders/${order.id}` },
    }),
  ]);
  return order;
}

/** Initialise a Paystack transaction for an order or rental the user owns. Returns the hosted checkout URL. */
export async function startPayment(target: { kind: "order" | "rental"; id: string }, userId: string) {
  if (!env.paystack.enabled) throw new PaymentGatewayUnavailable();

  let amount: number;
  let email: string;
  let metadata: Record<string, unknown>;
  let link: { orderId?: string; rentalBookingId?: string };

  if (target.kind === "order") {
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.findFirst({ where: { id: target.id, userId }, include: { items: true } });
      if (!o) throw new OrderError("Order not found.");
      if (o.status !== "AWAITING_PAYMENT") throw new OrderError("This order is not awaiting payment.");
      const vehicleId = o.items[0].vehicleId;
      await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${vehicleId} FOR UPDATE`;
      const v = await tx.vehicle.findUnique({ where: { id: vehicleId }, select: { status: true } });
      if (v?.status !== "AVAILABLE" || (await vehicleHeldByOther(tx, vehicleId, userId))) throw new OrderError("This vehicle has just been reserved by another customer.");
      return tx.order.update({ where: { id: o.id }, data: { holdExpiresAt: new Date(Date.now() + site.commerce.orderHoldMinutes * 60_000) } });
    });
    amount = Number(order.amountDue);
    email = order.email;
    metadata = { orderId: order.id, orderNumber: order.orderNumber };
    link = { orderId: order.id };
  } else {
    const booking = await prisma.rentalBooking.findFirst({ where: { id: target.id, userId }, include: { payments: { where: { status: "SUCCESS" } } } });
    if (!booking) throw new OrderError("Booking not found.");
    if (booking.status !== "CONFIRMED") throw new OrderError("Payment opens once your booking is confirmed.");
    if (booking.payments.length) throw new OrderError("This booking has already been paid.");
    amount = Number(booking.total);
    email = booking.email;
    metadata = { rentalBookingId: booking.id, bookingNumber: booking.bookingNumber };
    link = { rentalBookingId: booking.id };
  }
  if (amount <= 0) throw new OrderError("Nothing to pay for this item.");

  const reference = `VEL-${target.kind === "order" ? "O" : "R"}-${Date.now().toString(36).toUpperCase()}-${randomCode(6)}`;
  await prisma.payment.create({ data: { ...link, reference, amount, currency: env.paystack.currency } });
  const init = await initializeTransaction({ email, amount, reference, callbackUrl: `${env.appUrl}/api/payments/paystack/callback`, metadata });
  await prisma.payment.update({ where: { reference }, data: { authorizationUrl: init.authorization_url } });
  return init.authorization_url;
}

/**
 * Verifies a payment with Paystack and applies the result idempotently.
 * Called from both the browser callback and the signed webhook.
 */
export async function confirmPayment(reference: string) {
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) return { status: "unknown" as const };
  if (payment.status === "SUCCESS") return { status: "success" as const, payment };

  const result = await verifyTransaction(reference);
  const expectedSubunit = toSubunit(Number(payment.amount));
  const success = result.status === "success" && result.amount === expectedSubunit && result.currency === payment.currency;

  if (!success) {
    if (["failed", "abandoned", "reversed"].includes(result.status) || (result.status === "success" && result.amount !== expectedSubunit)) {
      await prisma.payment.updateMany({
        where: { reference, status: "PENDING" },
        data: { status: result.status === "abandoned" ? "ABANDONED" : "FAILED", gatewayResponse: result.status === "success" ? "Amount mismatch" : result.gateway_response ?? result.status },
      });
      return { status: "failed" as const, payment };
    }
    return { status: "pending" as const, payment };
  }

  const applied = await prisma.$transaction(async (tx) => {
    const res = await tx.payment.updateMany({
      where: { reference, status: { not: "SUCCESS" } },
      data: { status: "SUCCESS", channel: result.channel ?? null, gatewayResponse: result.gateway_response ?? null, paidAt: result.paid_at ? new Date(result.paid_at) : new Date() },
    });
    if (res.count === 0) return null; // already applied by a concurrent callback/webhook
    if (payment.orderId) {
      const order = await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "PAYMENT_CONFIRMED", holdExpiresAt: null },
        include: { items: true },
      });
      const reserved = await tx.vehicle.updateMany({ where: { id: order.items[0].vehicleId, status: "AVAILABLE" }, data: { status: "RESERVED" } });
      if (reserved.count === 0) {
        await tx.order.update({ where: { id: order.id }, data: { adminNote: "ATTENTION: payment received but vehicle was no longer available — arrange refund or alternative." } });
      }
      return { kind: "order" as const, userId: order.userId, email: order.email, name: order.customerName, number: order.orderNumber, id: order.id, title: order.items[0].title };
    }
    if (payment.rentalBookingId) {
      const b = await tx.rentalBooking.findUniqueOrThrow({ where: { id: payment.rentalBookingId } });
      return { kind: "rental" as const, userId: b.userId, email: b.email, name: b.customerName, number: b.bookingNumber, id: b.id, title: "Rental booking" };
    }
    return null;
  });

  if (applied) {
    const href = applied.kind === "order" ? `/dashboard/orders/${applied.id}` : `/dashboard/rentals/${applied.id}`;
    await Promise.all([
      notify(applied.userId, { type: "PAYMENT", title: "Payment confirmed", message: `${formatPrice(Number(payment.amount))} received for ${applied.number}.`, link: href }),
      notifyAdmins({ type: "PAYMENT", title: "Payment received", message: `${applied.number} — ${formatPrice(Number(payment.amount))}`, link: applied.kind === "order" ? `/admin/orders?q=${applied.number}` : `/admin/rentals?q=${applied.number}` }),
      logActivity(applied.userId, "payment.success", applied.kind === "order" ? "Order" : "RentalBooking", applied.id, reference),
      sendEmail({
        to: applied.email,
        subject: `Payment confirmed — ${applied.number}`,
        heading: "Payment confirmed",
        lines: [`Hello ${applied.name},`, `We've verified your payment of ${formatPrice(Number(payment.amount))} for ${applied.number} (${applied.title}).`, "Your VELORA advisor will be in touch with next steps."],
        cta: { label: "View details", href: `${env.appUrl}${href}` },
      }),
    ]);
  }
  return { status: "success" as const, payment };
}
