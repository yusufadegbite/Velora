import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { VehicleForm, type VehicleFormValues } from "@/components/admin/VehicleForm";

export const metadata = { title: "Edit vehicle" };
const n = (d: unknown) => (d == null ? "" : Number(d));

export default async function EditVehicle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [v, brands] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id }, include: { brand: true, images: { orderBy: { position: "asc" } }, specifications: { orderBy: [{ group: "asc" }, { position: "asc" }] } } }),
    prisma.vehicleBrand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!v) notFound();
  const initial: VehicleFormValues = {
    brandId: v.brandId, model: v.model, trim: v.trim ?? "", year: v.year, price: Number(v.price), previousPrice: n(v.previousPrice), mileage: v.mileage,
    transmission: v.transmission, fuelType: v.fuelType, bodyType: v.bodyType, drivetrain: v.drivetrain, condition: v.condition, status: v.status,
    engine: v.engine, engineCapacity: n(v.engineCapacity), horsepower: v.horsepower, seats: v.seats, exteriorColor: v.exteriorColor, interiorColor: v.interiorColor,
    location: v.location, vin: v.vin ?? "", description: v.description, featured: v.featured, forSale: v.forSale, forRent: v.forRent,
    dailyRate: n(v.dailyRate), weeklyRate: n(v.weeklyRate), monthlyRate: n(v.monthlyRate), securityDeposit: n(v.securityDeposit),
    imageUrls: v.images.map((i) => i.url), specs: v.specifications.map((s) => ({ group: s.group, label: s.label, value: s.value })),
  };
  return (
    <>
      <Link href="/admin/vehicles" className="text-xs text-slate hover:text-midnight">← Vehicles</Link>
      <div className="mt-2 mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="display text-3xl">{v.year} {v.brand.name} {v.model}</h1>
        <Link href={`/cars/${v.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold">View listing <ExternalLink className="size-4" /></Link>
      </div>
      <VehicleForm id={v.id} initial={initial} brands={brands} uploadsEnabled={env.cloudinary.enabled} />
    </>
  );
}
