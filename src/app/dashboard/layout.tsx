import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SiteNavbar } from "@/components/layout/SiteChrome";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export const metadata: Metadata = { title: { default: "My account", template: "%s · My account · VELORA" }, robots: { index: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  return (
    <>
      <SiteNavbar />
      <div className="min-h-screen bg-ivory pt-16">
        <div className="container-x flex flex-col gap-6 py-6 lg:flex-row lg:gap-10 lg:py-10">
          <DashboardSidebar variant="customer" unread={unread} user={{ name: user.name, email: user.email }} />
          <main id="main" className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </>
  );
}
