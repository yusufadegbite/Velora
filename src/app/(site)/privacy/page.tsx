import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  const s: [string, string][] = [
    ["What we collect", "Account details (name, email, phone), orders, bookings, enquiries and wishlist activity. Payment card details are handled by Paystack and never stored by VELORA."],
    ["How we use it", "To process your orders and bookings, contact you about vehicles you've enquired about, and send updates you've subscribed to."],
    ["Security", "Passwords are hashed with bcrypt. Sessions use secure, http-only cookies. Access to your data is restricted to you and authorised VELORA staff."],
    ["Your rights", "You can update your profile at any time, unsubscribe from marketing, or ask us to delete your account by contacting support."],
  ];
  return (
    <>
      <PageHeader title="Privacy Policy" crumbs={[{ label: "Home", href: "/" }, { label: "Privacy" }]} />
      <article className="container-x max-w-3xl space-y-8 py-14">
        {s.map(([t, d]) => <section key={t}><h2 className="text-lg font-semibold">{t}</h2><p className="mt-2 leading-relaxed text-midnight/80">{d}</p></section>)}
      </article>
    </>
  );
}
