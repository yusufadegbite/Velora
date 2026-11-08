import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DashHeader } from "@/components/dashboard/DashHeader";
import { ProfileForm } from "@/components/forms/AccountForms";

export const metadata = { title: "Profile Settings" };

export default async function ProfilePage() {
  const user = await requireUser();
  const u = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true, email: true, phone: true } });
  return (
    <>
      <DashHeader title="Profile Settings" description="Used to pre-fill your orders and bookings." />
      <div className="max-w-xl border border-line bg-white p-6 sm:p-8"><ProfileForm user={u} /></div>
    </>
  );
}
