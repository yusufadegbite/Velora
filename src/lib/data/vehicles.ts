import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { VehicleFilters } from "@/lib/validation";

export const PAGE_SIZE = 12;

export const vehicleCardInclude = {
  brand: { select: { name: true, slug: true } },
  images: { orderBy: { position: "asc" }, take: 2, select: { url: true, alt: true } },
} satisfies Prisma.VehicleInclude;

type CardRow = Prisma.VehicleGetPayload<{ include: typeof vehicleCardInclude }>;
const num = (d: Prisma.Decimal | null | undefined) => (d == null ? null : Number(d));

export type VehicleCardData = ReturnType<typeof toCard>;
export function toCard(v: CardRow) {
  return {
    id: v.id,
    slug: v.slug,
    brand: v.brand,
    model: v.model,
    trim: v.trim,
    year: v.year,
    name: `${v.brand.name} ${v.model}`,
    price: Number(v.price),
    previousPrice: num(v.previousPrice),
    mileage: v.mileage,
    transmission: v.transmission,
    fuelType: v.fuelType,
    bodyType: v.bodyType,
    condition: v.condition,
    status: v.status,
    horsepower: v.horsepower,
    engineCapacity: num(v.engineCapacity),
    location: v.location,
    featured: v.featured,
    forSale: v.forSale,
    forRent: v.forRent,
    dailyRate: num(v.dailyRate),
    weeklyRate: num(v.weeklyRate),
    monthlyRate: num(v.monthlyRate),
    image: v.images[0]?.url ?? null,
    imageAlt: v.images[0]?.alt ?? `${v.year} ${v.brand.name} ${v.model}`,
    hoverImage: v.images[1]?.url ?? null,
  };
}

export function buildVehicleWhere(f: VehicleFilters, mode: "sale" | "rent" = "sale"): Prisma.VehicleWhereInput {
  const and: Prisma.VehicleWhereInput[] = [];
  and.push(mode === "sale" ? { forSale: true } : { forRent: true });
  if (f.availability === "all") and.push({ status: { in: ["AVAILABLE", "RESERVED", "SOLD"] } });
  else and.push({ status: "AVAILABLE" });
  if (f.q) {
    const terms = f.q.split(/\s+/).filter(Boolean).slice(0, 5);
    for (const t of terms) {
      and.push({
        OR: [
          { model: { contains: t, mode: "insensitive" } },
          { trim: { contains: t, mode: "insensitive" } },
          { brand: { name: { contains: t, mode: "insensitive" } } },
          { engine: { contains: t, mode: "insensitive" } },
          ...(/^\d{4}$/.test(t) ? [{ year: Number(t) }] : []),
        ],
      });
    }
  }
  if (f.brand.length) and.push({ brand: { slug: { in: f.brand } } });
  if (f.model) and.push({ model: { contains: f.model, mode: "insensitive" } });
  const priceField = mode === "sale" ? "price" : "dailyRate";
  if (f.minPrice != null) and.push({ [priceField]: { gte: f.minPrice } });
  if (f.maxPrice != null) and.push({ [priceField]: { lte: f.maxPrice } });
  if (f.minYear != null) and.push({ year: { gte: f.minYear } });
  if (f.maxYear != null) and.push({ year: { lte: f.maxYear } });
  if (f.maxMileage != null) and.push({ mileage: { lte: f.maxMileage } });
  if (f.minEngine != null) and.push({ engineCapacity: { gte: f.minEngine } });
  if (f.maxEngine != null) and.push({ engineCapacity: { lte: f.maxEngine } });
  if (f.body.length) and.push({ bodyType: { in: f.body } });
  if (f.fuel.length) and.push({ fuelType: { in: f.fuel } });
  if (f.transmission.length) and.push({ transmission: { in: f.transmission } });
  if (f.condition.length) and.push({ condition: { in: f.condition } });
  return { AND: and };
}

function orderBy(sort: VehicleFilters["sort"], mode: "sale" | "rent"): Prisma.VehicleOrderByWithRelationInput[] {
  const priceField = mode === "sale" ? "price" : "dailyRate";
  switch (sort) {
    case "price_asc": return [{ [priceField]: "asc" }, { id: "asc" }];
    case "price_desc": return [{ [priceField]: "desc" }, { id: "asc" }];
    case "popular": return [{ viewCount: "desc" }, { id: "asc" }];
    case "recent": return [{ updatedAt: "desc" }, { id: "asc" }];
    case "year_desc": return [{ year: "desc" }, { id: "asc" }];
    case "mileage_asc": return [{ mileage: "asc" }, { id: "asc" }];
    default: return [{ createdAt: "desc" }, { id: "asc" }];
  }
}

export async function searchVehicles(f: VehicleFilters, mode: "sale" | "rent" = "sale") {
  const where = buildVehicleWhere(f, mode);
  const page = f.page ?? 1;
  const [total, rows] = await prisma.$transaction([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({ where, include: vehicleCardInclude, orderBy: orderBy(f.sort, mode), skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);
  return { total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), vehicles: rows.map(toCard) };
}

export async function getVehicleCards(where: Prisma.VehicleWhereInput, opts: { take?: number; orderBy?: Prisma.VehicleOrderByWithRelationInput[] } = {}) {
  const rows = await prisma.vehicle.findMany({ where, include: vehicleCardInclude, take: opts.take ?? 8, orderBy: opts.orderBy ?? [{ createdAt: "desc" }] });
  return rows.map(toCard);
}

export const getVehicleBySlug = cache(async (slug: string) => {
  const v = await prisma.vehicle.findUnique({
    where: { slug },
    include: {
      brand: true,
      images: { orderBy: { position: "asc" } },
      specifications: { orderBy: [{ group: "asc" }, { position: "asc" }] },
      reviews: { where: { approved: true }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!v || v.status === "ARCHIVED") return null;
  return {
    ...toCard({ ...v, images: v.images.slice(0, 2) }),
    images: v.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? `${v.year} ${v.brand.name} ${v.model}` })),
    brandFull: { id: v.brand.id, name: v.brand.name, slug: v.brand.slug, country: v.brand.country },
    drivetrain: v.drivetrain,
    engine: v.engine,
    seats: v.seats,
    exteriorColor: v.exteriorColor,
    interiorColor: v.interiorColor,
    description: v.description,
    vin: v.vin,
    securityDeposit: num(v.securityDeposit),
    createdAt: v.createdAt,
    specifications: v.specifications.map((s) => ({ group: s.group, label: s.label, value: s.value })),
    reviews: v.reviews.map((r) => ({ id: r.id, rating: r.rating, title: r.title, body: r.body, author: r.user.name, createdAt: r.createdAt })),
  };
});
export type VehicleDetail = NonNullable<Awaited<ReturnType<typeof getVehicleBySlug>>>;

/** Rows for the comparison table. */
export async function getComparisonVehicles(ids: string[]) {
  if (!ids.length) return [];
  const rows = await prisma.vehicle.findMany({
    where: { id: { in: ids }, status: { not: "ARCHIVED" } },
    include: { ...vehicleCardInclude, specifications: true },
  });
  return ids
    .map((id) => rows.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => ({
      ...toCard(r),
      drivetrain: r.drivetrain,
      engine: r.engine,
      seats: r.seats,
      exteriorColor: r.exteriorColor,
      interiorColor: r.interiorColor,
      specs: Object.fromEntries(r.specifications.map((s) => [s.label, s.value])),
    }));
}
export type ComparisonVehicle = Awaited<ReturnType<typeof getComparisonVehicles>>[number];

export const getBrands = cache(() =>
  prisma.vehicleBrand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, country: true, description: true, heroImage: true, logoUrl: true, _count: { select: { vehicles: { where: { status: "AVAILABLE" } } } } },
  }),
);

export async function getWishlistIds(userId: string | undefined) {
  if (!userId) return new Set<string>();
  const rows = await prisma.wishlist.findMany({ where: { userId }, select: { vehicleId: true } });
  return new Set(rows.map((r) => r.vehicleId));
}
