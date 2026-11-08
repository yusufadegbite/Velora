import type { Metadata } from "next";
import { BadgeCheck, Eye, Handshake, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { Counter } from "@/components/ui/Counter";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { VehicleImage } from "@/components/ui/VehicleImage";

export const metadata: Metadata = { title: "About Us", description: "VELORA is a premium automotive marketplace built on verified listings, transparent pricing and concierge-level service." };

const VALUES = [
  { Icon: BadgeCheck, t: "Verified, always", d: "Every vehicle is inspected across 180 points and its documents checked against customs and registry records before it's listed." },
  { Icon: Eye, t: "Radically transparent", d: "One honest price. Duties, plates, registration and delivery are itemised — never added at the end." },
  { Icon: Handshake, t: "One advisor, start to finish", d: "A named advisor guides you from first enquiry to handover, and stays your point of contact afterwards." },
  { Icon: Sparkles, t: "Occasion, not transaction", d: "Private viewings, detailed handovers and after-sales care that make the moment feel as special as the car." },
];

export default async function AboutPage() {
  const [vehicles, sold, rentals] = await Promise.all([
    prisma.vehicle.count({ where: { status: { not: "ARCHIVED" } } }),
    prisma.vehicle.count({ where: { status: "SOLD" } }),
    prisma.rentalBooking.count({ where: { status: { in: ["COMPLETED", "ACTIVE", "CONFIRMED"] } } }),
  ]);
  const image = (await prisma.vehicleImage.findFirst({ where: { vehicle: { featured: true } }, orderBy: { createdAt: "asc" } }))?.url ?? null;
  return (
    <>
      <section className="relative isolate overflow-hidden bg-midnight pt-40 pb-24 text-white">
        <VehicleImage src={image} alt="" fill sizes="100vw" className="-z-10 opacity-30" bare />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-midnight/80 via-midnight/70 to-midnight" />
        <div className="container-x">
          <p className="eyebrow">About VELORA</p>
          <h1 className="display mt-4 max-w-4xl text-4xl text-balance sm:text-6xl">We started VELORA because buying an exceptional car should be an exceptional experience.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">Founded in Lagos, VELORA combines the care of a private dealership with the clarity of a modern marketplace — verified vehicles, honest pricing and secure online reservations.</p>
        </div>
      </section>
      <section className="border-b border-line bg-white">
        <dl className="container-x grid grid-cols-2 divide-line py-12 lg:grid-cols-4 lg:divide-x">
          {[["Vehicles listed", vehicles, ""], ["Vehicles delivered", sold, ""], ["Rental journeys", rentals, ""], ["Inspection points", 180, ""]].map(([l, n]) => (
            <div key={l as string} className="px-6 py-4"><dt className="text-xs tracking-[0.18em] text-slate uppercase">{l}</dt><dd className="display mt-2 text-4xl sm:text-5xl"><Counter to={n as number} /></dd></div>
          ))}
        </dl>
      </section>
      <section className="container-x py-24">
        <Reveal className="max-w-2xl"><p className="eyebrow">What we stand for</p><h2 className="display mt-3 text-3xl sm:text-4xl">Four promises behind every key we hand over.</h2></Reveal>
        <Stagger className="mt-14 grid gap-px bg-line sm:grid-cols-2">
          {VALUES.map(({ Icon, t, d }) => (
            <StaggerItem key={t} className="bg-ivory p-8 sm:p-10"><Icon className="size-6 text-gold" /><h3 className="mt-6 text-xl font-semibold">{t}</h3><p className="mt-3 leading-relaxed text-slate">{d}</p></StaggerItem>
          ))}
        </Stagger>
      </section>
      <section className="bg-midnight py-20 text-white">
        <div className="container-x flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <h2 className="display max-w-xl text-3xl">Visit the Lekki showroom, or start exploring online.</h2>
          <div className="flex flex-wrap gap-3"><LinkButton href="/cars" size="lg">Explore Vehicles</LinkButton><LinkButton href="/contact" variant="outline-light" size="lg">Book a visit</LinkButton></div>
        </div>
      </section>
    </>
  );
}
