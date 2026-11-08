import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Gauge, Cog, Fuel, Zap, Car, Palette, Armchair, MapPin, ShieldCheck, Users, Settings2, CircleDot, Star, BadgeCheck, KeyRound, CalendarRange } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getVehicleBySlug, getVehicleCards, getWishlistIds } from "@/lib/data/vehicles";
import { prisma } from "@/lib/db";
import { site } from "@/lib/site";
import { formatMileage, formatPrice, label, whatsappLink, formatDate } from "@/lib/utils";
import { allowedPaymentOptions } from "@/lib/pricing/order";
import { VehicleGallery } from "@/components/vehicles/VehicleGallery";
import { PriceDisplay } from "@/components/vehicles/PriceDisplay";
import { SpecificationTable } from "@/components/vehicles/SpecificationTable";
import { WishlistButton } from "@/components/vehicles/WishlistButton";
import { CompareToggle } from "@/components/vehicles/CompareToggle";
import { RequestInfoButton } from "@/components/vehicles/VehicleActions";
import { ReviewForm } from "@/components/vehicles/ReviewForm";
import { ViewTracker } from "@/components/vehicles/ViewTracker";
import { VehicleGrid } from "@/components/vehicles/VehicleGrid";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsAppIcon } from "@/components/layout/WhatsAppButton";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const v = await getVehicleBySlug((await params).slug);
  if (!v) return { title: "Vehicle not found" };
  const title = `${v.year} ${v.name}${v.trim ? ` ${v.trim}` : ""}`;
  const description = `${title} — ${formatPrice(v.price)}. ${formatMileage(v.mileage)}, ${label("transmission", v.transmission)}, ${label("fuelType", v.fuelType)}. ${v.description.slice(0, 110)}…`;
  return {
    title,
    description,
    alternates: { canonical: `/cars/${v.slug}` },
    openGraph: { title, description, type: "website", images: v.images.slice(0, 1).map((i) => ({ url: i.url, alt: i.alt })) },
  };
}

export default async function VehiclePage({ params }: { params: Params }) {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) notFound();
  const user = await getCurrentUser();
  const [saved, related, userFull] = await Promise.all([
    getWishlistIds(user?.id),
    getVehicleCards({ id: { not: v.id }, status: "AVAILABLE", forSale: true, OR: [{ brandId: v.brandFull.id }, { bodyType: v.bodyType }] }, { take: 4, orderBy: [{ viewCount: "desc" }] }),
    user ? prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, phone: true } }) : null,
  ]);
  const name = `${v.year} ${v.name}${v.trim ? ` ${v.trim}` : ""}`;
  const purchasable = v.forSale && v.status === "AVAILABLE";
  const options = allowedPaymentOptions(v.price);
  const avgRating = v.reviews.length ? v.reviews.reduce((s, r) => s + r.rating, 0) / v.reviews.length : 0;
  const groups = Object.entries(v.specifications.reduce<Record<string, { label: string; value: string }[]>>((acc, s) => ((acc[s.group] ??= []).push(s), acc), {}));
  const highlights = groups.find(([g]) => g === "Highlights")?.[1] ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name,
    brand: { "@type": "Brand", name: v.brand.name },
    model: v.model,
    vehicleModelDate: String(v.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: v.mileage, unitCode: "KMT" },
    vehicleTransmission: label("transmission", v.transmission),
    fuelType: label("fuelType", v.fuelType),
    bodyType: label("bodyType", v.bodyType),
    color: v.exteriorColor,
    vehicleInteriorColor: v.interiorColor,
    itemCondition: v.condition === "NEW" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    vehicleEngine: { "@type": "EngineSpecification", name: v.engine, enginePower: { "@type": "QuantitativeValue", value: v.horsepower, unitCode: "BHP" } },
    image: v.images.map((i) => i.url),
    description: v.description,
    url: `${site.url}/cars/${v.slug}`,
    offers: { "@type": "Offer", price: v.price, priceCurrency: "NGN", availability: v.status === "AVAILABLE" ? "https://schema.org/InStock" : "https://schema.org/SoldOut", seller: { "@type": "AutoDealer", name: site.name } },
    ...(v.reviews.length ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avgRating.toFixed(1), reviewCount: v.reviews.length } } : {}),
  };

  const keyFacts = [
    { Icon: Calendar, l: "Year", val: v.year },
    { Icon: Gauge, l: "Mileage", val: formatMileage(v.mileage) },
    { Icon: Cog, l: "Transmission", val: label("transmission", v.transmission) },
    { Icon: Fuel, l: "Fuel", val: label("fuelType", v.fuelType) },
    { Icon: Zap, l: "Power", val: `${v.horsepower} hp` },
    { Icon: Car, l: "Body", val: label("bodyType", v.bodyType) },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewTracker id={v.id} />
      <div className="bg-midnight pt-20" />
      <div className="container-x pt-6">
        <nav aria-label="Breadcrumb" className="text-xs text-slate">
          <ol className="flex flex-wrap gap-1.5">
            <li><Link href="/" className="hover:text-midnight">Home</Link> /</li>
            <li><Link href="/cars" className="hover:text-midnight">Explore Cars</Link> /</li>
            <li><Link href={`/brands/${v.brand.slug}`} className="hover:text-midnight">{v.brand.name}</Link> /</li>
            <li aria-current="page" className="text-midnight">{v.model}</li>
          </ol>
        </nav>
      </div>

      <section className="container-x grid gap-10 py-8 lg:grid-cols-[1.45fr_1fr] lg:gap-14">
        <div className="min-w-0">
          <VehicleGallery images={v.images} name={name} />
          <ul className="mt-8 grid grid-cols-3 gap-px bg-line sm:grid-cols-6">
            {keyFacts.map(({ Icon, l, val }) => (
              <li key={l} className="bg-white p-4">
                <Icon className="size-4 text-gold" aria-hidden />
                <p className="mt-3 text-[0.65rem] tracking-[0.15em] text-slate uppercase">{l}</p>
                <p className="mt-0.5 text-sm font-semibold">{val}</p>
              </li>
            ))}
          </ul>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={v.status} label={label("vehicleStatus", v.status)} />
            <Badge>{label("condition", v.condition)}</Badge>
            {v.featured && <Badge tone="gold">Featured</Badge>}
          </div>
          <p className="mt-5 text-xs font-semibold tracking-[0.2em] text-slate uppercase">{v.brand.name} · {v.year}</p>
          <h1 className="display mt-2 text-3xl sm:text-4xl">{v.model} {v.trim && <span className="block text-xl font-medium text-slate sm:text-2xl">{v.trim}</span>}</h1>
          {v.reviews.length > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-slate"><Star className="size-4 fill-gold text-gold" />{avgRating.toFixed(1)} · {v.reviews.length} review{v.reviews.length > 1 && "s"}</p>
          )}
          <div className="mt-6 border-y border-line py-6">
            <p className="text-xs text-slate">{v.forSale ? "Selling price" : "Rental only"}</p>
            {v.forSale ? <PriceDisplay price={v.price} previousPrice={v.previousPrice} size="xl" className="mt-1" /> : v.dailyRate && <PriceDisplay price={v.dailyRate} suffix="/ day" size="xl" className="mt-1" />}
            {v.forSale && <p className="mt-2 text-xs text-slate">Reserve online with {Math.round(site.commerce.depositRate * 100)}% deposit: <strong className="text-midnight">{formatPrice(Math.round(v.price * site.commerce.depositRate))}</strong></p>}
          </div>

          <div className="mt-6 grid gap-3">
            {purchasable ? (
              <LinkButton href={`/checkout/${v.slug}`} size="lg" className="w-full">{options.includes("FULL_PAYMENT") ? "Place Order" : "Reserve this vehicle"}</LinkButton>
            ) : (
              <div className="bg-midnight/5 px-4 py-3 text-sm text-slate">{v.status === "SOLD" ? "This vehicle has been sold." : v.status === "RESERVED" ? "This vehicle is currently reserved. Enquire to join the waiting list." : "Not available for purchase."}</div>
            )}
            {v.forRent && v.status === "AVAILABLE" && <LinkButton href={`/rentals/${v.slug}`} variant="dark" size="lg" className="w-full"><CalendarRange className="size-4" />Book as a rental</LinkButton>}
            <a href={whatsappLink(site.whatsapp, `Hello VELORA, I'm interested in the ${name} (${site.url}/cars/${v.slug}).`)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 bg-[#1f9d55] px-5 text-sm font-semibold text-white transition hover:bg-[#188a49]">
              <WhatsAppIcon className="size-4" /> Contact via WhatsApp
            </a>
            <div className="grid grid-cols-2 gap-3">
              <WishlistButton vehicleId={v.id} saved={saved.has(v.id)} variant="full" />
              <CompareToggle entry={{ id: v.id, name: `${v.brand.name} ${v.model}`, image: v.image, year: v.year }} variant="full" />
            </div>
            <RequestInfoButton vehicleId={v.id} vehicleName={name} user={userFull} />
          </div>

          <ul className="mt-6 space-y-2.5 text-sm text-slate">
            <li className="flex gap-2.5"><BadgeCheck className="size-4 shrink-0 text-gold" />180-point inspection & verified documents</li>
            <li className="flex gap-2.5"><ShieldCheck className="size-4 shrink-0 text-gold" />Secure payment with server-side verification</li>
            <li className="flex gap-2.5"><MapPin className="size-4 shrink-0 text-gold" />Viewing at our {v.location} showroom</li>
          </ul>
        </aside>
      </section>

      <section className="container-x grid gap-14 py-12 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-12">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
            <div className="mt-4 space-y-4 leading-relaxed text-midnight/80">{v.description.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>
            {highlights.length > 0 && (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {highlights.map((h) => <li key={h.label} className="flex gap-3 border border-line bg-white p-4 text-sm"><CircleDot className="mt-0.5 size-4 shrink-0 text-gold" />{h.value}</li>)}
              </ul>
            )}
          </Reveal>
          <Reveal>
            <h2 className="mb-6 text-2xl font-semibold tracking-tight">Specifications</h2>
            <div className="grid gap-10 md:grid-cols-2">
              <SpecificationTable title="Engine & performance" rows={[
                { label: "Engine", value: v.engine, Icon: Settings2 },
                { label: "Engine capacity", value: v.engineCapacity ? `${v.engineCapacity.toFixed(1)} L` : "Electric" },
                { label: "Horsepower", value: `${v.horsepower} hp`, Icon: Zap },
                ...(groups.find(([g]) => g === "Performance")?.[1] ?? []).map((s) => ({ label: s.label, value: s.value })),
                ...(groups.find(([g]) => g === "Efficiency")?.[1] ?? []).map((s) => ({ label: s.label, value: s.value })),
              ]} />
              <SpecificationTable title="Vehicle details" rows={[
                { label: "Brand", value: v.brand.name },
                { label: "Model", value: `${v.model}${v.trim ? ` ${v.trim}` : ""}` },
                { label: "Body type", value: label("bodyType", v.bodyType), Icon: Car },
                { label: "Drivetrain", value: label("drivetrain", v.drivetrain) },
                { label: "Seats", value: v.seats, Icon: Users },
                { label: "Exterior colour", value: v.exteriorColor, Icon: Palette },
                { label: "Interior", value: v.interiorColor, Icon: Armchair },
                { label: "Condition", value: label("condition", v.condition) },
                { label: "Availability", value: label("vehicleStatus", v.status), Icon: KeyRound },
                { label: "Location", value: v.location, Icon: MapPin },
                { label: "VIN", value: v.vin },
              ]} />
              {groups.filter(([g]) => !["Performance", "Efficiency", "Highlights"].includes(g)).map(([g, rows]) => <SpecificationTable key={g} title={g} rows={rows} />)}
            </div>
          </Reveal>
        </div>
        <div>
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight">Owner reviews</h2>
            {v.reviews.length === 0 && <p className="mt-3 text-sm text-slate">No reviews yet for this vehicle.</p>}
            <ul className="mt-6 space-y-5">
              {v.reviews.map((r) => (
                <li key={r.id} className="border-b border-line pb-5">
                  <div className="flex gap-0.5" aria-label={`${r.rating} out of 5`}>{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={k < r.rating ? "size-3.5 fill-gold text-gold" : "size-3.5 text-line"} />)}</div>
                  <p className="mt-2 font-semibold">{r.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate">{r.body}</p>
                  <p className="mt-2 text-xs text-slate-light">{r.author} · {formatDate(r.createdAt)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-8 border border-line bg-white p-6">
              <h3 className="font-semibold">Share your experience</h3>
              {user ? <div className="mt-4"><ReviewForm vehicleId={v.id} /></div> : <p className="mt-2 text-sm text-slate"><Link href={`/login?next=/cars/${v.slug}`} className="font-semibold text-midnight underline">Sign in</Link> to leave a review.</p>}
            </div>
          </Reveal>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line bg-white py-16 sm:py-20" aria-label="Related vehicles">
          <div className="container-x">
            <div className="mb-10 flex items-end justify-between"><div><p className="eyebrow">You may also like</p><h2 className="display mt-2 text-3xl">Related vehicles</h2></div><Link href={`/brands/${v.brand.slug}`} className="text-sm font-semibold underline-offset-4 hover:underline">More {v.brand.name}</Link></div>
            <VehicleGrid vehicles={related} savedIds={saved} columns={4} />
          </div>
        </section>
      )}
    </>
  );
}
