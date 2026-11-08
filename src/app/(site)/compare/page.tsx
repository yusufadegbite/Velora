import type { Metadata } from "next";
import { GitCompareArrows } from "lucide-react";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getComparisonVehicles } from "@/lib/data/vehicles";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComparisonTable } from "@/components/compare/ComparisonTable";
import { ComparePicker } from "@/components/compare/ComparePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Compare Vehicles", description: "Compare up to four vehicles side by side — price, performance, specifications and more." };

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids: raw } = await searchParams;
  const ids = (raw ?? "").split(",").filter((id) => z.string().cuid().safeParse(id).success).slice(0, 4);
  const [vehicles, options] = await Promise.all([
    getComparisonVehicles(ids),
    prisma.vehicle.findMany({ where: { status: { in: ["AVAILABLE", "RESERVED"] } }, select: { id: true, model: true, year: true, trim: true, brand: { select: { name: true } }, images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } }, orderBy: [{ brand: { name: "asc" } }, { model: "asc" }] }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Side by side" title="Compare vehicles" description="Select up to four vehicles to compare price, performance and specification. The best value in each row is highlighted." crumbs={[{ label: "Home", href: "/" }, { label: "Compare" }]} />
      <section className="container-x space-y-8 py-12">
        <ComparePicker currentIds={vehicles.map((v) => v.id)} options={options.map((o) => ({ id: o.id, label: `${o.year} ${o.brand.name} ${o.model}${o.trim ? ` ${o.trim}` : ""}`, name: `${o.brand.name} ${o.model}`, year: o.year, image: o.images[0]?.url ?? null }))} />
        {vehicles.length >= 2 ? (
          <ComparisonTable vehicles={vehicles} />
        ) : (
          <EmptyState icon={GitCompareArrows} title={vehicles.length === 1 ? "Add one more vehicle" : "Start a comparison"} description="Use the selector above, or tap “Compare” on any vehicle card while you browse. Your selection follows you around the site." action={<LinkButton href="/cars" variant="dark">Browse vehicles</LinkButton>} />
        )}
      </section>
    </>
  );
}
