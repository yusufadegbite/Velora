import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getBrands } from "@/lib/data/vehicles";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { VehicleImage } from "@/components/ui/VehicleImage";

export const metadata: Metadata = { title: "Brands", description: "Browse VELORA's collection by manufacturer — Mercedes-Benz, BMW, Porsche, Range Rover, Lexus, Ferrari, Lamborghini and more." };

export default async function BrandsPage() {
  const brands = await getBrands();
  return (
    <>
      <PageHeader eyebrow="Marques" title="Browse by brand" description="Ten of the world's most desirable manufacturers, curated and verified." crumbs={[{ label: "Home", href: "/" }, { label: "Brands" }]} />
      <section className="container-x py-14">
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => (
            <StaggerItem key={b.id}>
              <Link href={`/brands/${b.slug}`} className="group relative block aspect-[4/3] overflow-hidden bg-midnight text-white">
                <VehicleImage src={b.heroImage} alt="" fill sizes="(min-width:1024px) 33vw, 50vw" className="opacity-50 transition-transform duration-[1.2s] group-hover:scale-105" bare />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/30 to-transparent" />
                <div className="absolute inset-x-6 bottom-6">
                  <p className="text-[0.65rem] tracking-[0.2em] text-white/50 uppercase">{b.country}</p>
                  <h2 className="mt-1 flex items-center justify-between text-2xl font-semibold tracking-tight group-hover:text-gold">{b.name}<ArrowUpRight className="size-5 text-gold" /></h2>
                  <p className="mt-2 line-clamp-2 text-sm text-white/60">{b.description}</p>
                  <p className="mt-3 text-xs font-semibold text-gold">{b._count.vehicles} available</p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </>
  );
}
