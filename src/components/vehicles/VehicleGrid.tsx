import type { VehicleCardData } from "@/lib/data/vehicles";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import { VehicleCard } from "./VehicleCard";

export function VehicleGrid({ vehicles, savedIds, mode = "sale", columns = 3, className }: { vehicles: VehicleCardData[]; savedIds?: Set<string>; mode?: "sale" | "rent"; columns?: 3 | 4; className?: string }) {
  return (
    <Stagger key={vehicles.map((v) => v.id).join(",")} className={cn("grid gap-5 sm:grid-cols-2 lg:gap-6", columns === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3", className)}>
      {vehicles.map((v, i) => (
        <StaggerItem key={v.id}>
          <VehicleCard vehicle={v} saved={savedIds?.has(v.id)} mode={mode} priority={i < 3} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
