import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { LoginForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const NOTICES: Record<string, string> = {
  google: "Google sign-in failed or was cancelled. Please try again.",
  google_unverified: "Your Google email isn't verified. Please use email and password instead.",
  suspended: "This account has been suspended. Please contact support.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = sp.next ? safeNext(sp.next) : "";
  const user = await getCurrentUser();
  if (user) redirect(next || (user.role === "ADMIN" ? "/admin" : "/dashboard"));
  return (
    <>
      <p className="eyebrow">Welcome back</p>
      <h1 className="display mt-3 text-4xl">Sign in to VELORA</h1>
      <p className="mt-3 mb-8 text-sm text-slate">New here? <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-semibold text-midnight underline underline-offset-4">Create an account</Link></p>
      <LoginForm next={next} googleEnabled={env.google.enabled} notice={sp.error ? NOTICES[sp.error] : undefined} />
    </>
  );
}
