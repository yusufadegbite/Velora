import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { Navbar } from "./Navbar";

/** Server wrapper so the client navbar gets the signed-in user + unread count. */
export async function SiteNavbar() {
  const user = await getCurrentUser();
  const unread = user ? await prisma.notification.count({ where: { userId: user.id, readAt: null } }) : 0;
  return <Navbar user={user ? { name: user.name, role: user.role, unread } : null} />;
}
