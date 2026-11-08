"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentUser, SESSION_COOKIE } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/tokens";
import { logActivity } from "@/lib/notify";
import { changePasswordSchema, fieldErrors, profileSchema, type FormState } from "@/lib/validation";

export async function updateProfileAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Please sign in." };
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name, phone: parsed.data.phone || null } });
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Profile updated." };
}

export async function changePasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Please sign in." };
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (record.passwordHash && !(await verifyPassword(parsed.data.currentPassword, record.passwordHash))) {
    return { errors: { currentPassword: "Your current password is incorrect." } };
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } }),
    prisma.session.deleteMany({ where: { userId: user.id, NOT: { tokenHash: hashToken(token) } } }),
  ]);
  await logActivity(user.id, "auth.password_changed");
  return { ok: true, message: "Password updated. Other devices have been signed out." };
}

export async function revokeSessionAction(sessionId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };
  await prisma.session.deleteMany({ where: { id: sessionId, userId: user.id } });
  revalidatePath("/dashboard/security");
  return { ok: true, message: "Session signed out." };
}

export async function markNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "All notifications marked as read." };
}
