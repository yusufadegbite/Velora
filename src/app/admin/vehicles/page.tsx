import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus, Star } from "lucide-react";
import { prisma } from "@/lib/db";
import { adminPaging } from "@/lib/admin";
import { formatPrice, label, LABELS } from "@/lib/utils";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { ActionButton } from "@/components/admin/ActionButton";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { StatusBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { deleteVehicle, setVehicleStatus, toggleFeatured } from "@/actions/admin";

export const metadata = { title: "Vehicles" };

export default async function AdminVehicles({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { page, q, skip, take, str, pages } = adminPaging(sp);
  const status = str("status"), brand = str("brand"), listing = str("listing");
  const where: Prisma.VehicleWhereInput = {
    ...(q ? { OR: [{ model: { contains: q, mode: "insensitive" } }, { brand: { name: { contains: q, mode: "insensitive" } } }, { vin: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } : {}),
    ...(status in LABELS.vehicleStatus ? { status: status as keyof typeof LABELS.vehicleStatus } : {}),
    ...(brand ? { brand: { slug: brand } } : {}),
    ...(listing === "sale" ? { forSale: true } : listing === "rent" ? { forRent: true } : listing === "featured" ? { featured: true } : {}),
  };
  const [total, vehicles, brands] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({ where, include: { brand: true, images: { take: 1, orderBy: { position: "asc" } } }, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.vehicleBrand.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);
  const rows = vehicles.map((v) => ({
    id: v.id,
    cells: {
      vehicle: (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-16 shrink-0 overflow-hidden bg-midnight"><VehicleImage src={v.images[0]?.url ?? null} alt="" fill sizes="64px" /></div>
          <div className="min-w-0"><Link href={`/admin/vehicles/${v.id}`} className="font-semibold hover:underline">{v.year} {v.brand.name} {v.model}</Link><p className="truncate text-xs text-slate">{v.trim ?? "—"} · {v.location}</p></div>
        </div>
      ),
      price: <div className="tabular-nums"><p className="font-semibold">{formatPrice(Number(v.price))}</p>{v.forRent && v.dailyRate && <p className="text-xs text-slate">{formatPrice(Number(v.dailyRate))}/day</p>}</div>,
      listing: <div className="flex flex-wrap gap-1 text-xs">{v.forSale && <span className="bg-midnight/6 px-1.5 py-0.5">Sale</span>}{v.forRent && <span className="bg-gold/15 px-1.5 py-0.5">Rent</span>}</div>,
      status: <StatusBadge status={v.status} label={label("vehicleStatus", v.status)} />,
      featured: <ActionButton action={toggleFeatured.bind(null, v.id)} title="Toggle featured"><Star className={v.featured ? "size-4 fill-gold text-gold" : "size-4 text-line"} /><span className="sr-only">{v.featured ? "Unfeature" : "Feature"}</span></ActionButton>,
      views: <span className="tabular-nums text-slate">{v.viewCount}</span>,
      actions: (
        <div className="flex items-center justify-end gap-3">
          <Link href={`/admin/vehicles/${v.id}`} className="text-xs font-semibold underline-offset-4 hover:underline">Edit</Link>
          {v.status === "ARCHIVED" ? <ActionButton action={setVehicleStatus.bind(null, v.id, "AVAILABLE")} className="text-success">Restore</ActionButton> : <ActionButton action={setVehicleStatus.bind(null, v.id, "ARCHIVED")} className="text-slate hover:text-midnight">Archive</ActionButton>}
          <ConfirmButton action={deleteVehicle.bind(null, v.id)} title="Delete this vehicle?" description="Vehicles with order or booking history are archived instead, to preserve records." confirmLabel="Delete" variant="ghost" size="sm">Delete</ConfirmButton>
        </div>
      ),
    },
  }));
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="display text-3xl">Vehicles</h1><p className="mt-1 text-sm text-slate">Manage inventory, pricing, availability and featured listings.</p></div><LinkButton href="/admin/vehicles/new"><Plus className="size-4" />Add vehicle</LinkButton></div>
      <AdminDataTable
        basePath="/admin/vehicles" params={sp} page={page} pages={pages(total)} total={total} searchPlaceholder="Search model, brand, VIN…"
        filters={[
          { name: "status", label: "Status", options: Object.entries(LABELS.vehicleStatus) },
          { name: "brand", label: "Brand", options: brands.map((b) => [b.slug, b.name]) },
          { name: "listing", label: "Listing", options: [["sale", "For sale"], ["rent", "For rent"], ["featured", "Featured"]] },
        ]}
        columns={[{ key: "vehicle", header: "Vehicle" }, { key: "price", header: "Price" }, { key: "listing", header: "Listing" }, { key: "status", header: "Status" }, { key: "featured", header: "Featured", className: "text-center" }, { key: "views", header: "Views" }, { key: "actions", header: "", className: "text-right" }]}
        rows={rows}
      />
    </>
  );
}
