import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <p className="eyebrow">Account recovery</p>
      <h1 className="display mt-3 text-4xl">Choose a new password</h1>
      {token ? <div className="mt-8"><ResetForm token={token} /></div> : <p className="mt-6 text-sm text-slate">This link is missing its token. <Link href="/forgot-password" className="font-semibold underline">Request a new link</Link>.</p>}
    </>
  );
}
