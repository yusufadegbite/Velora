import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <>
      <p className="eyebrow">Account recovery</p>
      <h1 className="display mt-3 text-4xl">Forgot your password?</h1>
      <p className="mt-3 mb-8 text-sm text-slate">Enter your email and we&apos;ll send a secure link to choose a new one. The link expires after 60 minutes.</p>
      <ForgotForm />
      <p className="mt-8 text-sm"><Link href="/login" className="font-semibold underline underline-offset-4">Back to sign in</Link></p>
    </>
  );
}
