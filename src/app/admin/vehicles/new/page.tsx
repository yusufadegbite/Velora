import Link from "next/link";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { VehicleForm, emptyVehicle } from "@/components/admin/VehicleForm";

export const metadata = { title: "Add vehicle" };

export default async function NewVehicle() {
  const brands = await prisma.vehicleBrand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <Link href="/admin/vehicles" className="text-xs text-slate hover:text-midnight">← Vehicles</Link>
      <h1 className="display mt-2 mb-8 text-3xl">Add vehicle</h1>
      <VehicleForm id={null} initial={emptyVehicle} brands={brands} uploadsEnabled={env.cloudinary.enabled} />
    </>
  );
}
