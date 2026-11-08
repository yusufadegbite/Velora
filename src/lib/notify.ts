import "server-only";
import { prisma } from "@/lib/db";

export async function notify(userId: string, n: { type: string; title: string; message: string; link?: string }) {
  try {
    await prisma.notification.create({ data: { userId, ...n } });
  } catch (err) {
    console.error("[notify] failed", err);
  }
}

export async function notifyAdmins(n: { type: string; title: string; message: string; link?: string }) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  if (admins.length) await prisma.notification.createMany({ data: admins.map((a) => ({ userId: a.id, ...n })) });
}

export async function logActivity(userId: string | null, action: string, entity?: string, entityId?: string, detail?: string) {
  try {
    await prisma.activityLog.create({ data: { userId, action, entity, entityId, detail } });
  } catch (err) {
    console.error("[activity] failed", err);
  }
}
