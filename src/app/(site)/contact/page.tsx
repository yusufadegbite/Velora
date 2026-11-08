import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { site } from "@/lib/site";
import { whatsappLink } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { EnquiryForm } from "@/components/vehicles/EnquiryForm";
import { WhatsAppIcon } from "@/components/layout/WhatsAppButton";

export const metadata: Metadata = { title: "Contact", description: "Speak to a VELORA advisor about buying, renting, financing or sourcing a vehicle." };

const TYPES = ["GENERAL", "VEHICLE_INFO", "TEST_DRIVE", "FINANCING", "RENTAL"];

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ type?: string; subject?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const profile = user ? await prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, phone: true } }) : null;
  const type = TYPES.includes(sp.type ?? "") ? sp.type : "GENERAL";
  const items = [
    { Icon: MapPin, t: "Showroom", d: site.address },
    { Icon: Phone, t: "Phone", d: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}` },
    { Icon: Mail, t: "Email", d: site.email, href: `mailto:${site.email}` },
    { Icon: Clock, t: "Opening hours", d: site.hours },
  ];
  return (
    <>
      <PageHeader eyebrow="Contact" title="Speak with a VELORA advisor" description="Whether you're buying, renting, financing or sourcing — we respond within one business day, usually much sooner." crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      <section className="container-x grid gap-14 py-14 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <ul className="divide-y divide-line border-y border-line">
            {items.map(({ Icon, t, d, href }) => (
              <li key={t} className="flex gap-4 py-5">
                <Icon className="mt-0.5 size-5 text-gold" />
                <div><p className="text-xs tracking-[0.18em] text-slate uppercase">{t}</p>{href ? <a href={href} className="mt-1 block font-medium hover:text-gold-dark">{d}</a> : <p className="mt-1 font-medium">{d}</p>}</div>
              </li>
            ))}
          </ul>
          <a href={whatsappLink(site.whatsapp, "Hello VELORA, I have a question.")} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex h-12 items-center gap-2 bg-[#1f9d55] px-6 text-sm font-semibold text-white"><WhatsAppIcon className="size-4" />Chat on WhatsApp</a>
          <div className="mt-8 aspect-[4/3] overflow-hidden border border-line bg-white">
            <iframe title="VELORA showroom location" className="size-full grayscale" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.openstreetmap.org/export/embed.html?bbox=3.462%2C6.428%2C3.482%2C6.443&layer=mapnik&marker=6.4355%2C3.472" />
          </div>
        </div>
        <div className="border border-line bg-white p-6 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight">Send us a message</h2>
          <p className="mt-2 mb-8 text-sm text-slate">Fields marked optional can be left blank.</p>
          <EnquiryForm user={profile} defaultType={type} defaultSubject={sp.subject?.slice(0, 140)} />
        </div>
      </section>
    </>
  );
}
