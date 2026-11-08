import Link from "next/link";
import type { EnquiryStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { adminPaging } from "@/lib/admin";
import { formatDateTime, label, LABELS, titleCase } from "@/lib/utils";
import { ActionButton } from "@/components/admin/ActionButton";
import { StatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { setEnquiryStatus } from "@/actions/admin";

export const metadata = { title: "Enquiries" };

export default async function AdminEnquiries({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { page, skip, take, str, pages, q } = adminPaging(sp);
  const status = str("status");
  const where: Prisma.ContactEnquiryWhereInput = {
    ...(status in LABELS.enquiryStatus ? { status: status as EnquiryStatus } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { subject: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.contactEnquiry.count({ where }),
    prisma.contactEnquiry.findMany({ where, include: { vehicle: { select: { slug: true, model: true, year: true } } }, orderBy: { createdAt: "desc" }, skip, take }),
  ]);
  const tabs: [string, string][] = [["", "All"], ...Object.entries(LABELS.enquiryStatus)];
  return (
    <>
      <div className="mb-6"><h1 className="display text-3xl">Enquiries</h1><p className="mt-1 text-sm text-slate">Contact forms, vehicle information requests, test drives and financing.</p></div>
      <nav className="mb-4 flex gap-1" aria-label="Filter by status">{tabs.map(([v, l]) => <Link key={v} href={v ? `/admin/enquiries?status=${v}` : "/admin/enquiries"} className={`px-3 py-1.5 text-xs font-semibold ${status === v ? "bg-midnight text-white" : "bg-white text-slate"}`}>{l}</Link>)}</nav>
      <ul className="space-y-3">
        {items.length === 0 && <li className="border border-line bg-white p-8 text-center text-sm text-slate">No enquiries.</li>}
        {items.map((e) => (
          <li key={e.id} className="border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{e.subject}</p>
                <p className="mt-0.5 text-xs text-slate">{e.name} · <a href={`mailto:${e.email}`} className="underline">{e.email}</a>{e.phone && ` · ${e.phone}`} · {formatDateTime(e.createdAt)} · {titleCase(e.type)}</p>
                {e.vehicle && <Link href={`/cars/${e.vehicle.slug}`} className="mt-1 inline-block text-xs font-semibold text-gold-dark">Re: {e.vehicle.year} {e.vehicle.model}</Link>}
              </div>
              <StatusBadge status={e.status} label={label("enquiryStatus", e.status)} />
            </div>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-midnight/80">{e.message}</p>
            <div className="mt-4 flex gap-4 border-t border-line pt-3">
              {e.status !== "IN_PROGRESS" && <ActionButton action={setEnquiryStatus.bind(null, e.id, "IN_PROGRESS")}>Mark in progress</ActionButton>}
              {e.status !== "RESOLVED" && <ActionButton action={setEnquiryStatus.bind(null, e.id, "RESOLVED")} className="text-success">Mark resolved</ActionButton>}
              {e.status !== "NEW" && <ActionButton action={setEnquiryStatus.bind(null, e.id, "NEW")} className="text-slate">Reopen</ActionButton>}
            </div>
          </li>
        ))}
      </ul>
      <Pagination page={page} pages={pages(total)} basePath="/admin/enquiries" params={sp} />
    </>
  );
}
