import Link from "next/link";
import { Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { site } from "@/lib/site";
import { NewsletterForm } from "./NewsletterForm";

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}><path d="M18.9 2H22l-7.5 8.6L23.3 22h-6.9l-5.4-7-6.2 7H1.7l8-9.2L1.3 2h7l4.9 6.4zm-1.2 18h1.9L7.4 4H5.4z" /></svg>
);

const COLUMNS = [
  { title: "Explore", links: [["All vehicles", "/cars"], ["New arrivals", "/cars?sort=newest"], ["Brands", "/brands"], ["Electric", "/cars?fuel=ELECTRIC"], ["Compare", "/compare"]] },
  { title: "Rentals", links: [["Rental fleet", "/rentals"], ["Chauffeur service", "/rentals#policies"], ["Rental policies", "/rentals#policies"], ["Long-term hire", "/contact?type=RENTAL"]] },
  { title: "Company", links: [["About VELORA", "/about"], ["Contact", "/contact"], ["Sell your car", "/contact?type=GENERAL&subject=Sell%20my%20car"], ["Financing", "/contact?type=FINANCING"]] },
  { title: "Account", links: [["Sign in", "/login"], ["Create account", "/register"], ["My orders", "/dashboard/orders"], ["Wishlist", "/dashboard/wishlist"]] },
] as const;

export function Footer() {
  const socials = [
    { href: site.social.instagram, label: "Instagram", Icon: Instagram },
    { href: site.social.x, label: "X", Icon: XIcon },
    { href: site.social.youtube, label: "YouTube", Icon: Youtube },
    { href: site.social.linkedin, label: "LinkedIn", Icon: Linkedin },
  ];
  return (
    <footer className="relative overflow-hidden bg-midnight-900 text-white">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" aria-hidden />
      <div className="container-x relative">
        <div className="grid gap-10 border-b border-white/10 py-14 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow">The VELORA Briefing</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">First access to new arrivals and private offers.</h2>
          </div>
          <NewsletterForm />
        </div>
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-5">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-white/55">{site.tagline} A premium marketplace for buying and renting exceptional vehicles in Nigeria.</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-gold" />{site.address}</li>
              <li><a href={`tel:${site.phone.replace(/\s/g, "")}`} className="flex gap-2.5 hover:text-gold"><Phone className="size-4 text-gold" />{site.phone}</a></li>
              <li><a href={`mailto:${site.email}`} className="flex gap-2.5 hover:text-gold"><Mail className="size-4 text-gold" />{site.email}</a></li>
            </ul>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}><Link href={href} className="text-sm text-white/70 transition hover:text-gold">{label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex flex-col-reverse items-start justify-between gap-6 border-t border-white/10 py-8 text-xs text-white/40 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} VELORA Automotive Ltd. All rights reserved. · <Link href="/terms" className="hover:text-white">Terms</Link> · <Link href="/privacy" className="hover:text-white">Privacy</Link></p>
          <ul className="flex gap-1">
            {socials.map(({ href, label, Icon }) => (
              <li key={label}><a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-9 place-items-center border border-white/10 text-white/60 transition hover:border-gold hover:text-gold"><Icon className="size-4" /></a></li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
