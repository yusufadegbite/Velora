import type { Metadata } from "next";
import { CalendarX2, Clock, ShieldCheck, Truck, UserCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getBrands, getWishlistIds, searchVehicles } from "@/lib/data/vehicles";
import { vehicleFilterSchema } from "@/lib/validation";
import { VehicleFilters } from "@/components/vehicles/VehicleFilters";
import { VehicleGrid } from "@/components/vehicles/VehicleGrid";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { RentalPolicies } from "@/components/rentals/RentalPolicies";

export const metadata: Metadata = { title: "Luxury Car Rentals", description: "Rent luxury cars and SUVs in Lagos, Abuja and Port Harcourt by the day, week or month. Chauffeur, delivery and premium cover available.", alternates: { canonical: "/rentals" } };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function RentalsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters = vehicleFilterSchema.parse(sp);
  const [user, brands, result] = await Promise.all([getCurrentUser(), getBrands(), searchVehicles(filters, "rent")]);
  const saved = await getWishlistIds(user?.id);
  const perks = [
    { Icon: Clock, t: "Daily, weekly & monthly", d: "Better rates the longer you drive" },
    { Icon: UserCheck, t: "Chauffeur on request", d: "Vetted, uniformed drivers" },
    { Icon: Truck, t: "Door-step delivery", d: "Home, office or airport" },
    { Icon: ShieldCheck, t: "Fully insured", d: "Comprehensive cover included" },
  ];
  return (
    <>
      <section className="relative overflow-hidden bg-midnight pt-32 pb-14 text-white">
        <div className="pointer-events-none absolute -top-20 -left-20 size-96 rounded-full bg-gold/10 blur-[120px]" aria-hidden />
        <div className="container-x relative">
          <p className="eyebrow">VELORA Rentals</p>
          <h1 className="display mt-3 max-w-3xl text-4xl sm:text-6xl">Drive extraordinary, on your schedule.</h1>
          <p className="mt-5 max-w-xl text-white/60">From a weekend in a Lamborghini Urus to a month in a Land Cruiser — transparent rates, live availability and concierge service on every booking.</p>
          <ul className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map(({ Icon, t, d }) => (
              <li key={t} className="flex items-center gap-4 bg-midnight p-5"><Icon className="size-5 shrink-0 text-gold" /><div><p className="text-sm font-semibold">{t}</p><p className="text-xs text-white/50">{d}</p></div></li>
            ))}
          </ul>
        </div>
      </section>
      <section className="container-x py-10 sm:py-14">
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[270px_1fr]">
          <VehicleFilters brands={brands.map((b) => ({ name: b.name, slug: b.slug, count: b._count.vehicles }))} total={result.total} mode="rent" />
          <div className="lg:col-start-2">
            {result.vehicles.length ? (
              <>
                <VehicleGrid vehicles={result.vehicles} savedIds={saved} mode="rent" />
                <Pagination page={result.page} pages={result.pages} basePath="/rentals" params={sp} />
              </>
            ) : (
              <EmptyState icon={CalendarX2} title="No rentals match those filters" description="Try adjusting your filters, or ask our concierge — we can often arrange vehicles outside the listed fleet." action={<><LinkButton href="/rentals" variant="dark">Clear filters</LinkButton><LinkButton href="/contact?type=RENTAL" variant="outline">Contact concierge</LinkButton></>} />
            )}
          </div>
        </div>
      </section>
      <RentalPolicies />
    </>
  );
}
