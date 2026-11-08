import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Car } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getWishlistIds, searchVehicles } from "@/lib/data/vehicles";
import { vehicleFilterSchema } from "@/lib/validation";
import { PageHeader } from "@/components/layout/PageHeader";
import { VehicleGrid } from "@/components/vehicles/VehicleGrid";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brand = await prisma.vehicleBrand.findUnique({ where: { slug: (await params).slug } });
  if (!brand) return { title: "Brand not found" };
  return { title: `${brand.name} for sale`, description: `${brand.name} vehicles for sale and rent at VELORA. ${brand.description ?? ""}`, alternates: { canonical: `/brands/${brand.slug}` } };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const brand = await prisma.vehicleBrand.findUnique({ where: { slug } });
  if (!brand) notFound();
  const filters = vehicleFilterSchema.parse({ ...sp, brand: slug });
  const [user, result] = await Promise.all([getCurrentUser(), searchVehicles(filters)]);
  const saved = await getWishlistIds(user?.id);
  return (
    <>
      <PageHeader eyebrow={brand.country ?? "Brand"} title={brand.name} description={brand.description ?? undefined} crumbs={[{ label: "Home", href: "/" }, { label: "Brands", href: "/brands" }, { label: brand.name }]}>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href={`/cars?brand=${brand.slug}`} variant="outline-light" size="sm">Filter {brand.name} in Explore</LinkButton>
          <LinkButton href={`/rentals?brand=${brand.slug}`} variant="outline-light" size="sm">{brand.name} rentals</LinkButton>
        </div>
      </PageHeader>
      <section className="container-x py-14">
        <p className="mb-6 text-sm text-slate"><strong className="text-midnight">{result.total}</strong> {brand.name} vehicles available</p>
        {result.vehicles.length ? (
          <>
            <VehicleGrid vehicles={result.vehicles} savedIds={saved} />
            <Pagination page={result.page} pages={result.pages} basePath={`/brands/${slug}`} params={sp} />
          </>
        ) : (
          <EmptyState icon={Car} title={`No ${brand.name} vehicles right now`} description="New arrivals land every week. Ask our concierge to source the exact model and specification you want." action={<LinkButton href={`/contact?type=VEHICLE_INFO&subject=${encodeURIComponent(`Sourcing a ${brand.name}`)}`}>Request a {brand.name}</LinkButton>} />
        )}
      </section>
    </>
  );
}
