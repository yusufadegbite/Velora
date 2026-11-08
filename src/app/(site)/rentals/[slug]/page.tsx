import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gauge, Cog, Fuel, Users, Zap, CalendarX2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getVehicleBySlug } from "@/lib/data/vehicles";
import { getUnavailableRanges } from "@/lib/services/rentals";
import { prisma } from "@/lib/db";
import { formatDateTime, formatMileage, formatPrice, label } from "@/lib/utils";
import { VehicleGallery } from "@/components/vehicles/VehicleGallery";
import { RentalBookingForm } from "@/components/rentals/RentalBookingForm";
import { RentalPolicies } from "@/components/rentals/RentalPolicies";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const v = await getVehicleBySlug((await params).slug);
  if (!v || !v.forRent) return { title: "Rental not found" };
  return { title: `Rent the ${v.year} ${v.name}`, description: `Rent the ${v.year} ${v.name} from ${formatPrice(v.dailyRate ?? 0)} per day. Chauffeur and delivery available.`, alternates: { canonical: `/rentals/${v.slug}` } };
}

export default async function RentalDetail({ params }: { params: Params }) {
  const v = await getVehicleBySlug((await params).slug);
  if (!v || !v.forRent || !v.dailyRate) notFound();
  const user = await getCurrentUser();
  const [unavailable, profile] = await Promise.all([getUnavailableRanges(v.id), user ? prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, phone: true } }) : null]);
  const name = `${v.year} ${v.name}`;
  const rates = [["Daily", v.dailyRate], ["Weekly", v.weeklyRate], ["Monthly", v.monthlyRate]] as const;
  return (
    <>
      <div className="bg-midnight pt-20" />
      <section className="container-x grid gap-10 py-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate"><Link href="/rentals" className="hover:text-midnight">Rentals</Link> / <span className="text-midnight">{v.brand.name} {v.model}</span></nav>
          <VehicleGallery images={v.images} name={name} />
        </div>
        <div className="lg:pt-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate uppercase">{v.brand.name} · {v.year}</p>
          <h1 className="display mt-2 text-3xl sm:text-4xl">{v.model} {v.trim && <span className="block text-xl font-medium text-slate">{v.trim}</span>}</h1>
          <dl className="mt-6 grid grid-cols-3 gap-px bg-line">
            {rates.map(([l, r]) => (
              <div key={l} className="bg-white p-4"><dt className="text-[0.65rem] tracking-[0.15em] text-slate uppercase">{l}</dt><dd className="mt-1 text-sm font-bold tabular-nums sm:text-base">{r ? formatPrice(r) : "—"}</dd></div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate">Refundable security deposit: <strong className="text-midnight">{formatPrice(v.securityDeposit ?? 0)}</strong></p>
          <ul className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <li className="flex items-center gap-2"><Zap className="size-4 text-gold" />{v.horsepower} hp</li>
            <li className="flex items-center gap-2"><Users className="size-4 text-gold" />{v.seats} seats</li>
            <li className="flex items-center gap-2"><Cog className="size-4 text-gold" />{label("transmission", v.transmission)}</li>
            <li className="flex items-center gap-2"><Fuel className="size-4 text-gold" />{label("fuelType", v.fuelType)}</li>
            <li className="flex items-center gap-2"><Gauge className="size-4 text-gold" />{formatMileage(v.mileage)}</li>
          </ul>
          <div className="mt-6 border-t border-line pt-5">
            <h2 className="text-sm font-semibold">Availability</h2>
            {v.status !== "AVAILABLE" ? <p className="mt-2 text-sm text-danger">Currently unavailable for rental.</p> : unavailable.length === 0 ? (
              <p className="mt-2 text-sm text-success">Available — no upcoming bookings.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-slate">
                {unavailable.slice(0, 5).map((u) => <li key={u.start}><span className="font-medium text-midnight">{u.kind}:</span> {formatDateTime(u.start)} → {formatDateTime(u.end)}</li>)}
              </ul>
            )}
          </div>
        </div>
      </section>
      <section className="container-x pb-16">
        <h2 className="display mb-8 border-t border-line pt-10 text-3xl">Book this vehicle</h2>
        {v.status !== "AVAILABLE" ? (
          <EmptyState icon={CalendarX2} title="This vehicle isn't available to book" description="Browse the rest of our rental fleet or speak to our concierge for alternatives." action={<LinkButton href="/rentals">View rental fleet</LinkButton>} />
        ) : user ? (
          <RentalBookingForm vehicle={{ id: v.id, name, dailyRate: v.dailyRate, weeklyRate: v.weeklyRate, monthlyRate: v.monthlyRate, securityDeposit: v.securityDeposit ?? 0 }} user={profile} unavailable={unavailable} />
        ) : (
          <div className="flex flex-col items-start gap-4 border border-line bg-white p-8 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-semibold">Sign in to book</p><p className="mt-1 text-sm text-slate">You'll be able to track, manage and pay for your booking from your dashboard.</p></div>
            <div className="flex gap-3"><LinkButton href={`/login?next=/rentals/${v.slug}`} variant="dark">Sign in</LinkButton><LinkButton href={`/register?next=/rentals/${v.slug}`} variant="outline">Create account</LinkButton></div>
          </div>
        )}
      </section>
      <RentalPolicies />
    </>
  );
}
