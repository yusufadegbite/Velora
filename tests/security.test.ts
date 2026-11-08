import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { vehicleFilterSchema, checkoutSchema, registerSchema } from "../src/lib/validation";

test("Paystack webhook signature check (HMAC-SHA512)", async () => {
  process.env.PAYSTACK_SECRET_KEY = "sk_test_unit";
  const { verifyWebhookSignature } = await import("../src/lib/payments/paystack");
  const body = JSON.stringify({ event: "charge.success", data: { reference: "VEL-1" } });
  const good = createHmac("sha512", "sk_test_unit").update(body).digest("hex");
  assert.equal(verifyWebhookSignature(body, good), true);
  assert.equal(verifyWebhookSignature(body + " ", good), false);
  assert.equal(verifyWebhookSignature(body, "deadbeef"), false);
  assert.equal(verifyWebhookSignature(body, null), false);
});

test("filter parsing drops unknown enum values and malformed slugs", () => {
  const f = vehicleFilterSchema.parse({ body: "SUV,TANK", brand: "bmw,<script>", minPrice: "abc", sort: "evil", page: "-3" });
  assert.deepEqual(f.body, ["SUV"]);
  assert.deepEqual(f.brand, ["bmw"]);
  assert.equal(f.minPrice, undefined);
  assert.equal(f.sort, undefined);
  assert.equal(f.page, undefined);
});

test("checkout schema has no price fields, and requires a delivery address for delivery", () => {
  const base = { vehicleId: "cjld2cjxh0000qzrmn831i7rn", paymentOption: "RESERVATION_DEPOSIT", customerName: "Ada Obi", email: "ada@example.com", phone: "+2348030000000", billingName: "Ada Obi", billingAddress: "1 Marina, Lagos", acceptTerms: "on" };
  assert.equal(checkoutSchema.safeParse({ ...base, fulfilment: "COLLECTION", price: 1 }).success, true);
  const parsed = checkoutSchema.parse({ ...base, fulfilment: "COLLECTION", price: 1, amountDue: 1 });
  assert.equal("price" in parsed, false);
  assert.equal(checkoutSchema.safeParse({ ...base, fulfilment: "DELIVERY" }).success, false);
});

test("passwords must be at least 8 chars with letters and numbers", () => {
  const r = (p: string) => registerSchema.safeParse({ name: "Ada", email: "a@b.co", password: p, confirmPassword: p }).success;
  assert.equal(r("short1"), false);
  assert.equal(r("onlyletters"), false);
  assert.equal(r("Velora2026"), true);
});
