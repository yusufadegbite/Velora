import { Heart } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toCard, vehicleCardInclude } from "@/lib/data/vehicles";
import { DashHeader } from "@/components/dashboard/DashHeader";
import { VehicleGrid } from "@/components/vehicles/VehicleGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const user = await requireUser();
  const rows = await prisma.wishlist.findMany({ where: { userId: user.id, vehicle: { status: { not: "ARCHIVED" } } }, include: { vehicle: { include: vehicleCardInclude } }, orderBy: { createdAt: "desc" } });
  const vehicles = rows.map((r) => toCard(r.vehicle));
  return (
    <>
      <DashHeader title="Wishlist" description={`${vehicles.length} saved ${vehicles.length === 1 ? "vehicle" : "vehicles"}`} />
      {vehicles.length ? <VehicleGrid vehicles={vehicles} savedIds={new Set(vehicles.map((v) => v.id))} /> : (
        <EmptyState icon={Heart} title="Your wishlist is empty" description="Tap the heart on any vehicle to save it here and keep an eye on price and availability." action={<LinkButton href="/cars">Explore vehicles</LinkButton>} />
      )}
    </>
  );
}
