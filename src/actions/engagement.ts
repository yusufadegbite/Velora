"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { limitByIp } from "@/lib/rate-limit";
import { notifyAdmins, logActivity } from "@/lib/notify";
import { sendEmail } from "@/lib/email";
import { enquirySchema, fieldErrors, newsletterSchema, reviewSchema, type FormState } from "@/lib/validation";

const id = z.string().cuid();

export async function toggleWishlist(vehicleId: string): Promise<{ ok: boolean; saved?: boolean; requiresLogin?: boolean; message?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, requiresLogin: true };
  if (!id.safeParse(vehicleId).success) return { ok: false, message: "Invalid vehicle" };
  const existing = await prisma.wishlist.findUnique({ where: { userId_vehicleId: { userId: user.id, vehicleId } } });
  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
    revalidatePath("/dashboard/wishlist");
    return { ok: true, saved: false, message: "Removed from your wishlist" };
  }
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } });
  if (!vehicle) return { ok: false, message: "Vehicle not found" };
  await prisma.wishlist.create({ data: { userId: user.id, vehicleId } });
  await logActivity(user.id, "wishlist.add", "Vehicle", vehicleId);
  revalidatePath("/dashboard/wishlist");
  return { ok: true, saved: true, message: "Saved to your wishlist" };
}

export async function saveComparison(vehicleIds: string[], name?: string): Promise<{ ok: boolean; message: string; requiresLogin?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, requiresLogin: true, message: "Sign in to save comparisons" };
  const ids = z.array(id).min(2).max(4).safeParse([...new Set(vehicleIds)]);
  if (!ids.success) return { ok: false, message: "Select between 2 and 4 vehicles to save a comparison." };
  const vehicles = await prisma.vehicle.findMany({ where: { id: { in: ids.data } }, include: { brand: true } });
  if (vehicles.length !== ids.data.length) return { ok: false, message: "One of these vehicles is no longer available." };
  const label = (name?.trim().slice(0, 80) || vehicles.map((v) => `${v.brand.name} ${v.model}`).join(" vs ")).slice(0, 120);
  const count = await prisma.comparison.count({ where: { userId: user.id } });
  if (count >= 30) return { ok: false, message: "You've reached the limit of 30 saved comparisons. Delete one to save another." };
  await prisma.comparison.create({ data: { userId: user.id, name: label, items: { create: ids.data.map((vehicleId, position) => ({ vehicleId, position })) } } });
  revalidatePath("/dashboard/comparisons");
  return { ok: true, message: "Comparison saved to your dashboard" };
}

export async function deleteComparison(comparisonId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in" };
  const res = await prisma.comparison.deleteMany({ where: { id: comparisonId, userId: user.id } });
  revalidatePath("/dashboard/comparisons");
  return res.count ? { ok: true, message: "Comparison deleted" } : { ok: false, message: "Comparison not found" };
}

export async function submitEnquiry(_: FormState, formData: FormData): Promise<FormState> {
  const limited = await limitByIp("enquiry", 5, 10 * 60_000);
  if (limited) return { message: limited };
  if (formData.get("company")) return { ok: true, message: "Thank you — we'll be in touch shortly." }; // honeypot
  const parsed = enquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const user = await getCurrentUser();
  const d = parsed.data;
  const vehicleId = d.vehicleId ? (await prisma.vehicle.findUnique({ where: { id: d.vehicleId }, select: { id: true } }))?.id : undefined;
  const enquiry = await prisma.contactEnquiry.create({
    data: { userId: user?.id, vehicleId, type: d.type, name: d.name, email: d.email, phone: d.phone || null, subject: d.subject, message: d.message },
  });
  await Promise.all([
    notifyAdmins({ type: "ENQUIRY", title: "New enquiry", message: `${d.name}: ${d.subject}`, link: `/admin/enquiries` }),
    logActivity(user?.id ?? null, "enquiry.created", "ContactEnquiry", enquiry.id),
    sendEmail({ to: d.email, subject: "We've received your enquiry", heading: "Thank you for contacting VELORA", lines: [`Hello ${d.name},`, `We've received your message about "${d.subject}". A VELORA advisor will respond within one business day.`] }),
  ]);
  return { ok: true, message: "Thank you — your enquiry has been sent. An advisor will contact you within one business day." };
}

export async function subscribeNewsletter(_: FormState, formData: FormData): Promise<FormState> {
  const limited = await limitByIp("newsletter", 5, 10 * 60_000);
  if (limited) return { message: limited };
  const parsed = newsletterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Enter a valid email address" };
  await prisma.newsletterSubscription.upsert({ where: { email: parsed.data.email }, update: { unsubscribedAt: null }, create: { email: parsed.data.email } });
  return { ok: true, message: "You're on the list. Expect new arrivals and private offers first." };
}

export async function submitReview(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Please sign in to leave a review." };
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const vehicle = await prisma.vehicle.findUnique({ where: { id: d.vehicleId }, select: { slug: true } });
  if (!vehicle) return { message: "Vehicle not found." };
  await prisma.review.upsert({
    where: { userId_vehicleId: { userId: user.id, vehicleId: d.vehicleId } },
    update: { rating: d.rating, title: d.title, body: d.body },
    create: { userId: user.id, vehicleId: d.vehicleId, rating: d.rating, title: d.title, body: d.body },
  });
  revalidatePath(`/cars/${vehicle.slug}`);
  return { ok: true, message: "Thank you — your review has been published." };
}

export async function trackVehicleView(vehicleId: string) {
  if (!id.safeParse(vehicleId).success) return;
  await prisma.vehicle.updateMany({ where: { id: vehicleId }, data: { viewCount: { increment: 1 } } });
}
