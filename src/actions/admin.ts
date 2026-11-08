"use server";
import { revalidatePath } from "next/cache";

import { z } from "zod";
import type { OrderStatus, RentalStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/session";
import { brandSchema, fieldErrors, vehicleSchema, type FormState } from "@/lib/validation";
import { slugify, label, formatPrice } from "@/lib/utils";
import { notify, logActivity } from "@/lib/notify";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

type Result = { ok: boolean; message: string };
const cuid = z.string().cuid();
const revalidateCatalogue = () => { revalidatePath("/", "layout"); };

// ─── Vehicles ────────────────────────────────────────────────────────────
export async function saveVehicleAction(vehicleId: string | null, payload: unknown): Promise<FormState & { id?: string }> {
  const admin = await assertAdmin();
  const parsed = vehicleSchema.safeParse(payload);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const d = parsed.data;
  const brand = await prisma.vehicleBrand.findUnique({ where: { id: d.brandId } });
  if (!brand) return { errors: { brandId: "Brand not found" } };
  const data = {
    brandId: d.brandId, model: d.model, trim: d.trim || null, year: d.year, price: d.price, previousPrice: d.previousPrice ?? null,
    mileage: d.mileage, transmission: d.transmission, fuelType: d.fuelType, bodyType: d.bodyType, drivetrain: d.drivetrain, condition: d.condition,
    status: d.status, engine: d.engine, engineCapacity: d.engineCapacity ?? null, horsepower: d.horsepower, seats: d.seats,
    exteriorColor: d.exteriorColor, interiorColor: d.interiorColor, location: d.location, vin: d.vin || null, description: d.description,
    featured: d.featured, forSale: d.forSale, forRent: d.forRent,
    dailyRate: d.forRent ? d.dailyRate ?? null : null, weeklyRate: d.forRent ? d.weeklyRate ?? null : null,
    monthlyRate: d.forRent ? d.monthlyRate ?? null : null, securityDeposit: d.forRent ? d.securityDeposit ?? null : null,
  };
  const name = `${brand.name} ${d.model}`;
  try {
    const id = await prisma.$transaction(async (tx) => {
      let vid = vehicleId;
      if (vid) {
        await tx.vehicle.update({ where: { id: vid }, data });
        await tx.vehicleImage.deleteMany({ where: { vehicleId: vid } });
        await tx.vehicleSpecification.deleteMany({ where: { vehicleId: vid } });
      } else {
        let slug = slugify(`${d.year} ${brand.name} ${d.model} ${d.trim ?? ""}`);
        if (await tx.vehicle.findUnique({ where: { slug }, select: { id: true } })) slug = `${slug}-${Date.now().toString(36)}`;
        vid = (await tx.vehicle.create({ data: { ...data, slug } })).id;
      }
      if (d.imageUrls.length) await tx.vehicleImage.createMany({ data: d.imageUrls.map((url, position) => ({ vehicleId: vid!, url, position, alt: `${d.year} ${name} — view ${position + 1}` })) });
      const seen = new Set<string>();
      const specs = d.specs.filter((s) => (seen.has(s.label) ? false : (seen.add(s.label), true)));
      if (specs.length) await tx.vehicleSpecification.createMany({ data: specs.map((s, position) => ({ vehicleId: vid!, ...s, position })) });
      return vid!;
    });
    await logActivity(admin.id, vehicleId ? "admin.vehicle_updated" : "admin.vehicle_created", "Vehicle", id, name);
    revalidateCatalogue();
    return { ok: true, message: vehicleId ? "Vehicle updated." : "Vehicle created.", id };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") return { errors: { vin: "Another vehicle already uses this VIN." } };
    console.error("[admin:vehicle]", err);
    return { message: "Could not save the vehicle." };
  }
}

export async function setVehicleStatus(id: string, status: "AVAILABLE" | "RESERVED" | "SOLD" | "ARCHIVED"): Promise<Result> {
  const admin = await assertAdmin();
  if (!cuid.safeParse(id).success) return { ok: false, message: "Invalid vehicle" };
  await prisma.vehicle.update({ where: { id }, data: { status } });
  await logActivity(admin.id, "admin.vehicle_status", "Vehicle", id, status);
  revalidateCatalogue();
  return { ok: true, message: `Vehicle marked ${label("vehicleStatus", status).toLowerCase()}.` };
}

export async function toggleFeatured(id: string): Promise<Result> {
  await assertAdmin();
  const v = await prisma.vehicle.findUnique({ where: { id }, select: { featured: true } });
  if (!v) return { ok: false, message: "Vehicle not found" };
  await prisma.vehicle.update({ where: { id }, data: { featured: !v.featured } });
  revalidateCatalogue();
  return { ok: true, message: v.featured ? "Removed from featured." : "Marked as featured." };
}

export async function deleteVehicle(id: string): Promise<Result> {
  const admin = await assertAdmin();
  const v = await prisma.vehicle.findUnique({ where: { id }, include: { _count: { select: { orderItems: true, rentalBookings: true } } } });
  if (!v) return { ok: false, message: "Vehicle not found" };
  if (v._count.orderItems || v._count.rentalBookings) {
    await prisma.vehicle.update({ where: { id }, data: { status: "ARCHIVED", featured: false } });
    revalidateCatalogue();
    return { ok: true, message: "This vehicle has order or booking history, so it was archived instead of deleted." };
  }
  await prisma.vehicle.delete({ where: { id } });
  await logActivity(admin.id, "admin.vehicle_deleted", "Vehicle", id, v.model);
  revalidateCatalogue();
  return { ok: true, message: "Vehicle deleted." };
}

export async function addAvailabilityBlock(vehicleId: string, _: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = z.object({ startsAt: z.coerce.date(), endsAt: z.coerce.date(), type: z.enum(["MAINTENANCE", "BLOCKED", "PRIVATE_USE"]), reason: z.string().max(200).optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: "Enter valid dates." };
  const { startsAt, endsAt, type, reason } = parsed.data;
  if (endsAt <= startsAt) return { message: "End must be after start." };
  const clash = await prisma.rentalBooking.findFirst({ where: { vehicleId, status: { in: ["CONFIRMED", "ACTIVE"] }, pickupAt: { lt: endsAt }, returnAt: { gt: startsAt } }, select: { bookingNumber: true } });
  if (clash) return { message: `That period overlaps confirmed booking ${clash.bookingNumber}.` };
  await prisma.rentalAvailability.create({ data: { vehicleId, startsAt, endsAt, type, reason: reason || null } });
  revalidatePath("/admin/rentals");
  return { ok: true, message: "Availability block added." };
}

export async function removeAvailabilityBlock(id: string): Promise<Result> {
  await assertAdmin();
  await prisma.rentalAvailability.deleteMany({ where: { id } });
  revalidatePath("/admin/rentals");
  return { ok: true, message: "Block removed." };
}

// ─── Brands ──────────────────────────────────────────────────────────────
export async function saveBrandAction(brandId: string | null, _: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = brandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const data = { name: d.name, slug: slugify(d.name), country: d.country || null, description: d.description || null, logoUrl: d.logoUrl || null, heroImage: d.heroImage || null };
  try {
    if (brandId) await prisma.vehicleBrand.update({ where: { id: brandId }, data });
    else await prisma.vehicleBrand.create({ data });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") return { errors: { name: "A brand with this name already exists." } };
    throw err;
  }
  revalidateCatalogue();
  return { ok: true, message: brandId ? "Brand updated." : "Brand created." };
}

export async function deleteBrand(id: string): Promise<Result> {
  await assertAdmin();
  const count = await prisma.vehicle.count({ where: { brandId: id } });
  if (count) return { ok: false, message: `This brand has ${count} vehicle(s). Reassign or delete them first.` };
  await prisma.vehicleBrand.delete({ where: { id } });
  revalidateCatalogue();
  return { ok: true, message: "Brand deleted." };
}

// ─── Orders ──────────────────────────────────────────────────────────────
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["AWAITING_PAYMENT", "PROCESSING", "CANCELLED"],
  AWAITING_PAYMENT: ["PAYMENT_CONFIRMED", "CANCELLED"],
  PAYMENT_CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<Result> {
  const admin = await assertAdmin();
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { ok: false, message: "Order not found" };
  if (!ORDER_TRANSITIONS[order.status].includes(status)) return { ok: false, message: `Can't move an order from ${label("orderStatus", order.status)} to ${label("orderStatus", status)}.` };
  if (status === "PAYMENT_CONFIRMED") {
    // Manual confirmation is only for offline payments (bank transfer etc.) and is recorded as such.
    if (!note?.trim()) return { ok: false, message: "Add a note describing the offline payment (e.g. transfer reference) to confirm manually." };
  }
  const vehicleId = order.items[0]?.vehicleId;
  await prisma.$transaction(async (tx) => {
    const data: Prisma.OrderUpdateInput = { status, adminNote: note?.trim() ? note.trim().slice(0, 500) : order.adminNote };
    if (status === "CANCELLED") Object.assign(data, { cancelledAt: new Date(), cancelReason: note?.trim() || "Cancelled by VELORA", holdExpiresAt: null });
    await tx.order.update({ where: { id: orderId }, data });
    if (!vehicleId) return;
    if (status === "PAYMENT_CONFIRMED" || status === "PROCESSING") await tx.vehicle.updateMany({ where: { id: vehicleId, status: "AVAILABLE" }, data: { status: "RESERVED" } });
    if (status === "COMPLETED") await tx.vehicle.update({ where: { id: vehicleId }, data: { status: "SOLD", featured: false } });
    if (status === "CANCELLED" && ["PAYMENT_CONFIRMED", "PROCESSING"].includes(order.status)) {
      const otherActive = await tx.order.count({ where: { id: { not: orderId }, items: { some: { vehicleId } }, status: { in: ["PAYMENT_CONFIRMED", "PROCESSING"] } } });
      if (!otherActive) await tx.vehicle.updateMany({ where: { id: vehicleId, status: "RESERVED" }, data: { status: "AVAILABLE" } });
    }
  });
  await Promise.all([
    notify(order.userId, { type: "ORDER", title: `Order ${label("orderStatus", status).toLowerCase()}`, message: `${order.orderNumber} — ${order.items[0]?.title}`, link: `/dashboard/orders/${order.id}` }),
    logActivity(admin.id, "admin.order_status", "Order", order.id, `${order.orderNumber} → ${status}`),
    sendEmail({ to: order.email, subject: `Order ${order.orderNumber}: ${label("orderStatus", status)}`, heading: `Your order is now “${label("orderStatus", status)}”`, lines: [`Hello ${order.customerName},`, `Order ${order.orderNumber} (${order.items[0]?.title}) has been updated.`, ...(status === "CANCELLED" && note ? [`Reason: ${note}`] : [])], cta: { label: "View order", href: `${env.appUrl}/dashboard/orders/${order.id}` } }),
  ]);
  revalidatePath("/admin/orders");
  revalidateCatalogue();
  return { ok: true, message: `Order moved to ${label("orderStatus", status)}.` };
}

// ─── Rentals ─────────────────────────────────────────────────────────────
const RENTAL_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED"],
  COMPLETED: [], CANCELLED: [], REJECTED: [],
};

export async function updateRentalStatus(bookingId: string, status: RentalStatus, note?: string): Promise<Result> {
  const admin = await assertAdmin();
  const b = await prisma.rentalBooking.findUnique({ where: { id: bookingId }, include: { vehicle: { include: { brand: true } } } });
  if (!b) return { ok: false, message: "Booking not found" };
  if (!RENTAL_TRANSITIONS[b.status].includes(status)) return { ok: false, message: `Can't move from ${label("rentalStatus", b.status)} to ${label("rentalStatus", status)}.` };
  const data: Prisma.RentalBookingUpdateInput = { status, adminNote: note?.trim() ? note.trim().slice(0, 500) : b.adminNote };
  if (status === "CANCELLED" || status === "REJECTED") Object.assign(data, { cancelledAt: new Date(), cancelReason: note?.trim() || (status === "REJECTED" ? "Unavailable for the requested dates" : "Cancelled by VELORA") });
  await prisma.rentalBooking.update({ where: { id: bookingId }, data });
  const vehicleName = `${b.vehicle.year} ${b.vehicle.brand.name} ${b.vehicle.model}`;
  const msg: Partial<Record<RentalStatus, string>> = {
    CONFIRMED: `Great news — your booking is confirmed. Total ${formatPrice(Number(b.total))}. You can now pay securely from your dashboard.`,
    REJECTED: `Unfortunately we can't accommodate this booking${note ? `: ${note}` : "."} No payment has been taken.`,
    CANCELLED: `Your booking has been cancelled${note ? `: ${note}` : "."}`,
    ACTIVE: "Enjoy the drive! Your rental is now active.",
    COMPLETED: "Thank you for driving with VELORA. Your security deposit will be released within 5 business days.",
  };
  await Promise.all([
    notify(b.userId, { type: "RENTAL", title: `Booking ${label("rentalStatus", status).toLowerCase()}`, message: `${b.bookingNumber} — ${vehicleName}`, link: `/dashboard/rentals/${b.id}` }),
    logActivity(admin.id, "admin.rental_status", "RentalBooking", b.id, `${b.bookingNumber} → ${status}`),
    sendEmail({ to: b.email, subject: `Booking ${b.bookingNumber}: ${label("rentalStatus", status)}`, heading: `Booking ${label("rentalStatus", status).toLowerCase()}`, lines: [`Hello ${b.customerName},`, `${vehicleName}, ${b.days} day(s).`, msg[status] ?? ""], cta: { label: "View booking", href: `${env.appUrl}/dashboard/rentals/${b.id}` } }),
  ]);
  revalidatePath("/admin/rentals");
  return { ok: true, message: `Booking ${label("rentalStatus", status).toLowerCase()}.` };
}

// ─── Customers ───────────────────────────────────────────────────────────
export async function setUserActive(userId: string, active: boolean): Promise<Result> {
  const admin = await assertAdmin();
  if (userId === admin.id) return { ok: false, message: "You can't suspend your own account." };
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { isActive: active } }),
    ...(active ? [] : [prisma.session.deleteMany({ where: { userId } })]),
  ]);
  await logActivity(admin.id, active ? "admin.user_reactivated" : "admin.user_suspended", "User", userId);
  revalidatePath("/admin/customers");
  return { ok: true, message: active ? "Account reactivated." : "Account suspended and signed out." };
}

export async function setUserRole(userId: string, role: "ADMIN" | "CUSTOMER"): Promise<Result> {
  const admin = await assertAdmin();
  if (userId === admin.id) return { ok: false, message: "You can't change your own role." };
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await logActivity(admin.id, "admin.user_role", "User", userId, role);
  revalidatePath("/admin/customers");
  return { ok: true, message: role === "ADMIN" ? "User promoted to administrator." : "Administrator access removed." };
}

// ─── Enquiries ───────────────────────────────────────────────────────────
export async function setEnquiryStatus(id: string, status: "NEW" | "IN_PROGRESS" | "RESOLVED"): Promise<Result> {
  await assertAdmin();
  await prisma.contactEnquiry.update({ where: { id }, data: { status } });
  revalidatePath("/admin/enquiries");
  return { ok: true, message: `Enquiry marked ${label("enquiryStatus", status).toLowerCase()}.` };
}

// ─── Content ─────────────────────────────────────────────────────────────
const url = z.string().url().max(500);
const opt = (s: z.ZodString) => s.optional().or(z.literal("")).transform((v) => v || null);
const contentSchemas = {
  banner: z.object({ eyebrow: opt(z.string().max(60)), title: z.string().trim().min(3).max(120), subtitle: opt(z.string().max(300)), imageUrl: url, ctaLabel: opt(z.string().max(40)), ctaHref: opt(z.string().max(200)), position: z.coerce.number().int().min(0).max(100), active: z.boolean() }),
  promotion: z.object({ title: z.string().trim().min(3).max(120), description: z.string().trim().min(5).max(400), badge: opt(z.string().max(30)), imageUrl: url, ctaLabel: opt(z.string().max(40)), ctaHref: opt(z.string().max(200)), active: z.boolean(), endsAt: z.string().optional().transform((v) => (v ? new Date(v) : null)) }),
  testimonial: z.object({ name: z.string().trim().min(2).max(80), title: opt(z.string().max(120)), quote: z.string().trim().min(10).max(600), rating: z.coerce.number().int().min(1).max(5), position: z.coerce.number().int().min(0).max(100), active: z.boolean() }),
};
type ContentKind = keyof typeof contentSchemas;

export async function saveContentAction(kind: ContentKind, id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const raw = { ...Object.fromEntries(formData), active: formData.get("active") === "on" };
  const parsed = contentSchemas[kind].safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const data = parsed.data as never;
  if (kind === "banner") id ? await prisma.banner.update({ where: { id }, data }) : await prisma.banner.create({ data });
  if (kind === "promotion") id ? await prisma.promotion.update({ where: { id }, data }) : await prisma.promotion.create({ data });
  if (kind === "testimonial") id ? await prisma.testimonial.update({ where: { id }, data }) : await prisma.testimonial.create({ data });
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

export async function deleteContent(kind: ContentKind, id: string): Promise<Result> {
  await assertAdmin();
  if (kind === "banner") await prisma.banner.deleteMany({ where: { id } });
  if (kind === "promotion") await prisma.promotion.deleteMany({ where: { id } });
  if (kind === "testimonial") await prisma.testimonial.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Deleted." };
}

