import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [vehicles, brands] = await Promise.all([
    prisma.vehicle.findMany({ where: { status: { not: "ARCHIVED" } }, select: { slug: true, updatedAt: true, forRent: true } }),
    prisma.vehicleBrand.findMany({ select: { slug: true, updatedAt: true } }),
  ]);
  const staticPages = ["", "/cars", "/rentals", "/brands", "/compare", "/about", "/contact", "/terms", "/privacy"].map((p) => ({
    url: `${site.url}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.7,
  }));
  return [
    ...staticPages,
    ...brands.map((b) => ({ url: `${site.url}/brands/${b.slug}`, lastModified: b.updatedAt, priority: 0.6 })),
    ...vehicles.map((v) => ({ url: `${site.url}/cars/${v.slug}`, lastModified: v.updatedAt, priority: 0.8 })),
    ...vehicles.filter((v) => v.forRent).map((v) => ({ url: `${site.url}/rentals/${v.slug}`, lastModified: v.updatedAt, priority: 0.6 })),
  ];
}
