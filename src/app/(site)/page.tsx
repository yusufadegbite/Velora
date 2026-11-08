import { Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getBrands, getVehicleCards, getWishlistIds } from "@/lib/data/vehicles";
import { site } from "@/lib/site";
import { whatsappLink } from "@/lib/utils";
import { Hero } from "@/components/home/Hero";
import { SectionHeading } from "@/components/home/SectionHeading";
import { BrandGrid } from "@/components/home/BrandGrid";
import { WhyVelora } from "@/components/home/WhyVelora";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Testimonials } from "@/components/home/Testimonials";
import { Offers } from "@/components/home/Offers";
import { SignatureCollection } from "@/components/home/SignatureCollection";
import { VehicleGrid } from "@/components/vehicles/VehicleGrid";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsAppIcon } from "@/components/layout/WhatsAppButton";

export const revalidate = 60;

export default async function HomePage() {
  const now = new Date();
  const [user, brands, featured, latest, rentals, signature, promos, testimonials, banner, stats] = await Promise.all([
    getCurrentUser(),
    getBrands(),
    getVehicleCards({ featured: true, status: "AVAILABLE", forSale: true }, { take: 6, orderBy: [{ price: "desc" }] }),
    getVehicleCards({ status: "AVAILABLE", forSale: true }, { take: 4, orderBy: [{ createdAt: "desc" }] }),
    getVehicleCards({ status: "AVAILABLE", forRent: true }, { take: 4, orderBy: [{ viewCount: "desc" }] }),
    getVehicleCards({ status: "AVAILABLE", forSale: true, price: { gte: 300_000_000 } }, { take: 8, orderBy: [{ price: "desc" }] }),
    prisma.promotion.findMany({ where: { active: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] }, orderBy: { createdAt: "asc" }, take: 3 }),
    prisma.testimonial.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
    prisma.banner.findFirst({ where: { active: true }, orderBy: { position: "asc" } }),
    prisma.$transaction([prisma.vehicle.count({ where: { status: "AVAILABLE" } }), prisma.vehicleBrand.count(), prisma.user.count({ where: { role: "CUSTOMER" } })]),
  ]);
  const saved = await getWishlistIds(user?.id);

  return (
    <>
      <Hero
        eyebrow={banner?.eyebrow ?? "The 2025 Collection"}
        title={banner?.title ?? "Find Your Drive. Define Your Journey."}
        subtitle={banner?.subtitle ?? "Explore exceptional vehicles, discover exclusive deals and experience a smarter way to buy or rent your next car."}
        image={banner?.imageUrl ?? featured[0]?.image ?? null}
        brands={brands.map((b) => ({ name: b.name, slug: b.slug }))}
        stats={{ vehicles: stats[0], brands: stats[1], customers: stats[2] }}
      />

      <section className="py-20 sm:py-28" aria-labelledby="featured">
        <div className="container-x">
          <SectionHeading eyebrow="Featured vehicles" title="Selected for the discerning driver." description="Hand-picked by our acquisitions team — each one inspected, verified and ready for handover." href="/cars?sort=price_desc" linkLabel="Explore all vehicles" />
          <VehicleGrid vehicles={featured} savedIds={saved} />
        </div>
      </section>

      <section className="bg-midnight py-20 sm:py-28" aria-label="Browse by brand">
        <div className="container-x">
          <SectionHeading dark eyebrow="Browse by brand" title="The marques that define the road." href="/brands" linkLabel="All brands" />
          <BrandGrid brands={brands} />
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="container-x"><WhyVelora image={signature[1]?.image ?? featured[1]?.image ?? null} /></div>
      </section>

      {signature.length > 0 && (
        <section className="overflow-hidden bg-midnight-900 py-20 sm:py-28" aria-label="Premium collection">
          <div className="container-x">
            <SectionHeading dark eyebrow="The Signature Collection" title="Rare. Exceptional. Unrepeatable." description="Our most exclusive vehicles — available by private viewing at the Lekki showroom." href="/cars?minPrice=300000000&sort=price_desc" linkLabel="View the collection" />
            <SignatureCollection items={signature} />
          </div>
        </section>
      )}

      <section className="py-20 sm:py-28" aria-label="Latest arrivals">
        <div className="container-x">
          <SectionHeading eyebrow="Latest arrivals" title="Just landed in the showroom." href="/cars?sort=newest" linkLabel="See all new arrivals" />
          <VehicleGrid vehicles={latest} savedIds={saved} columns={4} />
        </div>
      </section>

      <section className="border-y border-line bg-white py-20 sm:py-28" aria-label="Popular rentals">
        <div className="container-x">
          <SectionHeading eyebrow="Popular rentals" title="Drive something extraordinary this weekend." description="Daily, weekly and monthly hire with optional chauffeur and door-step delivery." href="/rentals" linkLabel="View the rental fleet" />
          <VehicleGrid vehicles={rentals} savedIds={saved} mode="rent" columns={4} />
        </div>
      </section>

      {promos.length > 0 && (
        <section className="py-20 sm:py-28" aria-label="Special offers">
          <div className="container-x">
            <SectionHeading eyebrow="Special offers" title="Private offers, for a limited time." />
            <Offers promos={promos} />
          </div>
        </section>
      )}

      <section className="bg-midnight py-20 text-white sm:py-28" aria-label="How it works">
        <div className="container-x">
          <SectionHeading dark eyebrow="How it works" title="From first click to keys in hand." />
          <HowItWorks />
        </div>
      </section>

      <section className="py-20 sm:py-28" aria-label="Customer testimonials">
        <div className="container-x">
          <SectionHeading align="center" eyebrow="Client stories" title="Trusted by drivers who expect more." />
          <Testimonials items={testimonials} />
        </div>
      </section>

      <section className="pb-20 sm:pb-28">
        <div className="container-x">
          <Reveal className="relative overflow-hidden bg-gold px-6 py-14 sm:px-14 sm:py-16">
            <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full border-[40px] border-midnight/5" aria-hidden />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-xs font-bold tracking-[0.22em] text-midnight/60 uppercase">Concierge</p>
                <h2 className="display mt-3 text-3xl text-balance text-midnight sm:text-4xl">Can&apos;t find the exact spec? We&apos;ll source it.</h2>
                <p className="mt-3 max-w-xl text-midnight/70">Tell us the car, colour and budget. Our acquisitions team sources from verified partners in Europe, the US and the Gulf.</p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <LinkButton href="/contact?type=VEHICLE_INFO&subject=Vehicle%20sourcing%20request" variant="dark" size="lg">Request a vehicle</LinkButton>
                <a href={whatsappLink(site.whatsapp, "Hello VELORA, I'd like help sourcing a vehicle.")} target="_blank" rel="noopener noreferrer" className="inline-flex h-[52px] items-center gap-2 border border-midnight/25 px-6 text-sm font-semibold text-midnight transition hover:bg-midnight hover:text-white">
                  <WhatsAppIcon className="size-4" /> WhatsApp
                </a>
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="inline-flex h-[52px] items-center gap-2 px-2 text-sm font-semibold text-midnight"><Phone className="size-4" />{site.phone}</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
