"use server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser, safeNext } from "@/lib/auth/session";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { limitByIp, rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { notify, logActivity } from "@/lib/notify";
import { fieldErrors, forgotSchema, loginSchema, registerSchema, resetSchema, type FormState } from "@/lib/validation";

// A constant hash so login timing doesn't reveal whether an email exists.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword("velora-timing-equaliser"));

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const limited = await limitByIp("register", 5, 15 * 60_000);
  if (limited) return { message: limited };
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { name, email, phone, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { errors: { email: "An account with this email already exists. Try signing in." } };
  const user = await prisma.user.create({ data: { name, email, phone: phone || null, passwordHash: await hashPassword(password) } });
  await createSession(user.id);
  await Promise.all([
    notify(user.id, { type: "WELCOME", title: "Welcome to VELORA", message: "Your account is ready. Save vehicles, compare models and book in a few clicks.", link: "/cars" }),
    logActivity(user.id, "auth.register"),
    sendEmail({ to: email, subject: "Welcome to VELORA", heading: `Welcome, ${name.split(" ")[0]}`, lines: ["Your VELORA account is ready.", "Save vehicles to your wishlist, compare models side by side, and reserve or rent with confidence."], cta: { label: "Explore vehicles", href: `${env.appUrl}/cars` } }),
  ]);
  redirect(safeNext(formData.get("next")));
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const limited = await limitByIp("login", 10, 15 * 60_000);
  if (limited) return { message: limited };
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { email, password } = parsed.data;
  if (!rateLimit(`login-email:${email}`, 8, 15 * 60_000).ok) return { message: "Too many attempts for this account. Please wait 15 minutes or reset your password." };
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !user.passwordHash || !valid) return { message: "Incorrect email or password." };
  if (!user.isActive) return { message: "This account has been suspended. Please contact VELORA support." };
  await createSession(user.id);
  await logActivity(user.id, "auth.login");
  redirect(safeNext(formData.get("next"), user.role === "ADMIN" ? "/admin" : "/dashboard"));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const limited = await limitByIp("forgot", 5, 15 * 60_000);
  if (limited) return { message: limited };
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user?.isActive) {
    const token = generateToken();
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60_000) } });
    await sendEmail({
      to: user.email,
      subject: "Reset your VELORA password",
      heading: "Password reset request",
      lines: ["We received a request to reset your password. This link expires in 60 minutes.", "If you didn't request this, you can safely ignore this email."],
      cta: { label: "Choose a new password", href: `${env.appUrl}/reset-password?token=${token}` },
    });
  }
  // Same response either way to avoid account enumeration.
  return { ok: true, message: "If an account exists for that email, we've sent a reset link. Please check your inbox." };
}

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const limited = await limitByIp("reset", 10, 15 * 60_000);
  if (limited) return { message: limited };
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return { message: "This reset link is invalid or has expired. Please request a new one." };
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);
  await createSession(record.userId);
  await logActivity(record.userId, "auth.password_reset");
  redirect("/dashboard?reset=1");
}

export async function currentUserSummary() {
  const u = await getCurrentUser();
  return u ? { name: u.name, role: u.role } : null;
}
