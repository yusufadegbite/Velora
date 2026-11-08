import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · VELORA" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const newEnquiries = await prisma.contactEnquiry.count({ where: { status: "NEW" } });
  return (
    <div className="min-h-screen bg-ivory lg:flex">
      <div className="bg-midnight px-4 pt-4 lg:p-0"><DashboardSidebar variant="admin" unread={newEnquiries} user={{ name: admin.name, email: admin.email }} /></div>
      <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-10">{children}</main>
    </div>
  );
}
