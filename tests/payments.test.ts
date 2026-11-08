/**
 * Integration test for server-side payment verification with a stubbed Paystack API.
 * Requires DATABASE_URL and a seeded database.
 */
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

process.env.PAYSTACK_SECRET_KEY = "sk_test_stub";
const prisma = new PrismaClient();
let verifyResponse: Record<string, unknown> = {};
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.startsWith("https://api.paystack.co/transaction/verify/")) {
    return new Response(JSON.stringify({ status: true, message: "ok", data: verifyResponse }), { status: 200 });
  }
  return realFetch(input, init);
}) as typeof fetch;

async function setup(tag: string, amount: number) {
  const user = await prisma.user.findFirstOrThrow({ where: { role: "CUSTOMER" } });
  const vehicle = await prisma.vehicle.create({
    data: { slug: `test-${tag}-${Date.now()}`, brandId: (await prisma.vehicleBrand.findFirstOrThrow()).id, model: "Test", year: 2024, price: 1_000_000, mileage: 0, transmission: "AUTOMATIC", fuelType: "PETROL", bodyType: "SEDAN", condition: "NEW", engine: "x", horsepower: 100, exteriorColor: "x", interiorColor: "x", description: "x".repeat(40) },
  });
  const order = await prisma.order.create({
    data: { orderNumber: `VO-TEST-${tag}-${Date.now()}`, userId: user.id, status: "AWAITING_PAYMENT", paymentOption: "RESERVATION_DEPOSIT", subtotal: 1_000_000, amountDue: amount, customerName: "T", email: "t@example.com", phone: "1", fulfilment: "COLLECTION", billingName: "T", billingAddress: "x",
      items: { create: { vehicleId: vehicle.id, title: "Test", unitPrice: 1_000_000 } }, payments: { create: { reference: `VEL-TEST-${tag}-${Date.now()}`, amount, currency: "NGN" } } },
    include: { payments: true },
  });
  return { vehicle, order, reference: order.payments[0].reference };
}

const cleanup: (() => Promise<unknown>)[] = [];
after(async () => {
  for (const c of cleanup.reverse()) await c();
  await prisma.$disconnect();
  globalThis.fetch = realFetch;
});

test("successful verification confirms the order and reserves the vehicle (idempotently)", async () => {
  const { confirmPayment } = await import("../src/lib/services/orders");
  const { vehicle, order, reference } = await setup("ok", 100_000);
  cleanup.push(() => prisma.vehicle.delete({ where: { id: vehicle.id } }), () => prisma.order.delete({ where: { id: order.id } }), () => prisma.payment.deleteMany({ where: { orderId: order.id } }));
  verifyResponse = { status: "success", reference, amount: 10_000_000, currency: "NGN", channel: "card", paid_at: new Date().toISOString() };
  const [a, b] = await Promise.all([confirmPayment(reference), confirmPayment(reference)]); // callback + webhook race
  assert.equal(a.status, "success"); assert.equal(b.status, "success");
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status, "PAYMENT_CONFIRMED");
  assert.equal((await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).status, "RESERVED");
  assert.equal((await prisma.payment.findUniqueOrThrow({ where: { reference } })).status, "SUCCESS");
  assert.equal(await prisma.notification.count({ where: { title: "Payment confirmed", message: { contains: order.orderNumber } } }), 1, "side effects applied exactly once");
});

test("amount mismatch is rejected and the order stays unpaid", async () => {
  const { confirmPayment } = await import("../src/lib/services/orders");
  const { vehicle, order, reference } = await setup("short", 100_000);
  cleanup.push(() => prisma.vehicle.delete({ where: { id: vehicle.id } }), () => prisma.order.delete({ where: { id: order.id } }), () => prisma.payment.deleteMany({ where: { orderId: order.id } }));
  verifyResponse = { status: "success", reference, amount: 100, currency: "NGN" }; // ₦1 paid instead of ₦100,000
  const r = await confirmPayment(reference);
  assert.equal(r.status, "failed");
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status, "AWAITING_PAYMENT");
  assert.equal((await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).status, "AVAILABLE");
  assert.equal((await prisma.payment.findUniqueOrThrow({ where: { reference } })).gatewayResponse, "Amount mismatch");
});

test("failed or abandoned charges never confirm the order", async () => {
  const { confirmPayment } = await import("../src/lib/services/orders");
  const { vehicle, order, reference } = await setup("fail", 100_000);
  cleanup.push(() => prisma.vehicle.delete({ where: { id: vehicle.id } }), () => prisma.order.delete({ where: { id: order.id } }), () => prisma.payment.deleteMany({ where: { orderId: order.id } }));
  verifyResponse = { status: "abandoned", reference, amount: 10_000_000, currency: "NGN" };
  assert.equal((await confirmPayment(reference)).status, "failed");
  assert.equal((await prisma.payment.findUniqueOrThrow({ where: { reference } })).status, "ABANDONED");
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status, "AWAITING_PAYMENT");
});
