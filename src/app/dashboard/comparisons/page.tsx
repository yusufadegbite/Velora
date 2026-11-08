import Link from "next/link";
import { GitCompareArrows, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { DashHeader } from "@/components/dashboard/DashHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { deleteComparison } from "@/actions/engagement";

export const metadata = { title: "Saved Comparisons" };

export default async function ComparisonsPage() {
  const user = await requireUser();
  const list = await prisma.comparison.findMany({
    where: { userId: user.id },
    include: { items: { orderBy: { position: "asc" }, include: { vehicle: { select: { id: true, images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } } } } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <DashHeader title="Saved Comparisons" />
      {list.length === 0 ? (
        <EmptyState icon={GitCompareArrows} title="No saved comparisons" description="Compare up to four vehicles side by side, then save the comparison to revisit it later." action={<LinkButton href="/compare">Start comparing</LinkButton>} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((c) => (
            <li key={c.id} className="border border-line bg-white p-5">
              <div className="flex -space-x-3">{c.items.map((i) => <div key={i.id} className="relative h-14 w-20 overflow-hidden border-2 border-white bg-midnight"><VehicleImage src={i.vehicle.images[0]?.url ?? null} alt="" fill sizes="80px" /></div>)}</div>
              <p className="mt-4 font-semibold">{c.name}</p>
              <p className="text-xs text-slate">{c.items.length} vehicles · saved {formatDate(c.createdAt)}</p>
              <div className="mt-4 flex items-center justify-between">
                <Link href={`/compare?ids=${c.items.map((i) => i.vehicle.id).join(",")}`} className="inline-flex items-center gap-1.5 text-sm font-semibold">Open<ArrowRight className="size-4 text-gold" /></Link>
                <ConfirmButton action={deleteComparison.bind(null, c.id)} title="Delete comparison?" description="This removes the saved comparison. The vehicles are not affected." confirmLabel="Delete" variant="ghost">Delete</ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
