import Link from "next/link";
import { prisma } from "@/lib/db";
import { BrandFormButton } from "@/components/admin/BrandForm";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteBrand } from "@/actions/admin";

export const metadata = { title: "Brands" };

export default async function AdminBrands() {
  const brands = await prisma.vehicleBrand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { vehicles: true } } } });
  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4"><div><h1 className="display text-3xl">Brands & categories</h1><p className="mt-1 text-sm text-slate">Body types, fuel types and conditions are fixed categories; brands are managed here.</p></div><BrandFormButton /></div>
      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b border-line bg-ivory/60 text-left text-[0.68rem] tracking-[0.14em] text-slate uppercase"><th className="px-4 py-3">Brand</th><th className="px-4 py-3">Country</th><th className="px-4 py-3">Vehicles</th><th className="px-4 py-3" /></tr></thead>
          <tbody className="divide-y divide-line">
            {brands.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3"><p className="font-semibold">{b.name}</p><p className="line-clamp-1 max-w-md text-xs text-slate">{b.description}</p></td>
                <td className="px-4 py-3 text-slate">{b.country ?? "—"}</td>
                <td className="px-4 py-3"><Link href={`/admin/vehicles?brand=${b.slug}`} className="underline-offset-4 hover:underline">{b._count.vehicles}</Link></td>
                <td className="px-4 py-3"><div className="flex items-center justify-end gap-4"><BrandFormButton brand={b} /><ConfirmButton action={deleteBrand.bind(null, b.id)} title={`Delete ${b.name}?`} description="Brands with vehicles can't be deleted." confirmLabel="Delete" variant="ghost">Delete</ConfirmButton></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
