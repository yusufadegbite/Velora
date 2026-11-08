import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { RegisterForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <>
      <p className="eyebrow">Join VELORA</p>
      <h1 className="display mt-3 text-4xl">Create your account</h1>
      <p className="mt-3 mb-8 text-sm text-slate">Already have one? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-midnight underline underline-offset-4">Sign in</Link></p>
      <RegisterForm next={next} googleEnabled={env.google.enabled} />
    </>
  );
}
