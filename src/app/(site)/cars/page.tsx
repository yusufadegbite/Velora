import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getBrands, getWishlistIds, searchVehicles } from "@/lib/data/vehicles";
import { vehicleFilterSchema } from "@/lib/validation";
import { PageHeader } from "@/components/layout/PageHeader";
import { VehicleFilters } from "@/components/vehicles/VehicleFilters";
import { VehicleGrid } from "@/components/vehicles/VehicleGrid";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  return {
    title: q ? `Search: ${q}` : "Explore Cars",
    description: "Browse verified luxury and premium vehicles for sale in Nigeria. Filter by brand, price, year, mileage, fuel type and more.",
    alternates: { canonical: "/cars" },
  };
}

export default async function CarsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters = vehicleFilterSchema.parse(sp);
  const [user, brands, result] = await Promise.all([getCurrentUser(), getBrands(), searchVehicles(filters, "sale")]);
  const saved = await getWishlistIds(user?.id);
  return (
    <>
      <PageHeader eyebrow="The collection" title={filters.q ? `Results for “${filters.q}”` : "Explore Cars"} description="Every vehicle is inspected, verified and priced transparently. Refine by brand, budget and specification." crumbs={[{ label: "Home", href: "/" }, { label: "Explore Cars" }]} />
      <section className="container-x py-10 sm:py-14">
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[270px_1fr]">
          <VehicleFilters brands={brands.map((b) => ({ name: b.name, slug: b.slug, count: b._count.vehicles }))} total={result.total} />
          <div className="lg:col-start-2">
            {result.vehicles.length ? (
              <>
                <VehicleGrid vehicles={result.vehicles} savedIds={saved} />
                <Pagination page={result.page} pages={result.pages} basePath="/cars" params={sp} />
              </>
            ) : (
              <EmptyState icon={SearchX} title="No vehicles match those filters" description="Try widening your price range or removing a filter. Or tell our concierge exactly what you're looking for — we source vehicles to order." action={<><LinkButton href="/cars" variant="dark">Clear all filters</LinkButton><LinkButton href="/contact?type=VEHICLE_INFO&subject=Vehicle%20sourcing%20request" variant="outline">Ask our concierge</LinkButton></>} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
