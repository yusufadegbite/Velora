import { cookies } from "next/headers";
import { Monitor } from "lucide-react";
import { requireUser, SESSION_COOKIE } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { DashHeader } from "@/components/dashboard/DashHeader";
import { PasswordForm } from "@/components/forms/AccountForms";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Badge } from "@/components/ui/Badge";
import { revokeSessionAction } from "@/actions/account";

export const metadata = { title: "Account Security" };

export default async function SecurityPage() {
  const user = await requireUser();
  const current = hashToken((await cookies()).get(SESSION_COOKIE)?.value ?? "");
  const [u, sessions] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true, googleId: true, lastLoginAt: true } }),
    prisma.session.findMany({ where: { userId: user.id, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <>
      <DashHeader title="Account Security" description={u.lastLoginAt ? `Last sign-in ${formatDateTime(u.lastLoginAt)}` : undefined} />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border border-line bg-white p-6 sm:p-8">
          <h2 className="font-semibold">{u.passwordHash ? "Change password" : "Set a password"}</h2>
          <p className="mt-1 mb-6 text-sm text-slate">{u.googleId && "You also sign in with Google. "}Changing your password signs out your other devices.</p>
          <PasswordForm hasPassword={Boolean(u.passwordHash)} />
        </section>
        <section className="border border-line bg-white p-6 sm:p-8">
          <h2 className="font-semibold">Active sessions</h2>
          <ul className="mt-4 divide-y divide-line">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center gap-4 py-4">
                <Monitor className="size-5 shrink-0 text-gold" />
                <div className="min-w-0 flex-1 text-sm"><p className="truncate font-medium">{s.userAgent?.replace(/\(.*?\)/g, "").slice(0, 60) || "Unknown device"}</p><p className="text-xs text-slate">Signed in {formatDateTime(s.createdAt)}{s.ipAddress && ` · ${s.ipAddress}`}</p></div>
                {s.tokenHash === current ? <Badge tone="success">This device</Badge> : <ConfirmButton action={revokeSessionAction.bind(null, s.id)} title="Sign out this device?" description="That device will need to sign in again." confirmLabel="Sign out" variant="ghost">Sign out</ConfirmButton>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
