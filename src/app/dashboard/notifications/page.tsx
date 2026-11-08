import Link from "next/link";
import { Bell } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDateTime, cn } from "@/lib/utils";
import { DashHeader } from "@/components/dashboard/DashHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { MarkReadButton } from "@/components/dashboard/MarkReadButton";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <>
      <DashHeader title="Notifications" description={unread ? `${unread} unread` : "You're all caught up."} action={unread > 0 && <MarkReadButton />} />
      {items.length === 0 ? <EmptyState icon={Bell} title="No notifications" description="Order updates, booking confirmations and payment receipts will appear here." /> : (
        <ul className="divide-y divide-line border border-line bg-white">
          {items.map((n) => {
            const body = (
              <div className={cn("flex gap-4 p-5", !n.readAt && "bg-gold/5")}>
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-line" : "bg-gold")} aria-label={n.readAt ? "Read" : "Unread"} />
                <div className="flex-1"><p className="font-semibold">{n.title}</p><p className="mt-0.5 text-sm text-slate">{n.message}</p><p className="mt-1 text-xs text-slate-light">{formatDateTime(n.createdAt)}</p></div>
              </div>
            );
            return <li key={n.id}>{n.link ? <Link href={n.link} className="block hover:bg-ivory">{body}</Link> : body}</li>;
          })}
        </ul>
      )}
    </>
  );
}
