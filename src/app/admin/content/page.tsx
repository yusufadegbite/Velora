import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ContentFormButton } from "@/components/admin/ContentForm";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Badge } from "@/components/ui/Badge";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { deleteContent } from "@/actions/admin";

export const metadata = { title: "Content" };

function Section({ title, description, add, children }: { title: string; description: string; add: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5"><div><h2 className="font-semibold">{title}</h2><p className="text-xs text-slate">{description}</p></div>{add}</div>
      <ul className="divide-y divide-line">{children}</ul>
    </section>
  );
}

export default async function ContentPage() {
  const [banners, promos, testimonials, featured] = await Promise.all([
    prisma.banner.findMany({ orderBy: { position: "asc" } }),
    prisma.promotion.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.testimonial.findMany({ orderBy: { position: "asc" } }),
    prisma.vehicle.count({ where: { featured: true, status: "AVAILABLE" } }),
  ]);
  const Row = ({ img, title, sub, active, actions }: { img?: string; title: string; sub?: string | null; active: boolean; actions: React.ReactNode }) => (
    <li className="flex items-center gap-4 px-5 py-3.5">
      {img && <div className="relative h-12 w-20 shrink-0 overflow-hidden bg-midnight"><VehicleImage src={img} alt="" fill sizes="80px" /></div>}
      <div className="min-w-0 flex-1"><p className="truncate font-medium">{title}</p>{sub && <p className="truncate text-xs text-slate">{sub}</p>}</div>
      {active ? <Badge tone="success">Live</Badge> : <Badge>Hidden</Badge>}
      <div className="flex items-center gap-4">{actions}</div>
    </li>
  );
  return (
    <div className="space-y-6">
      <div><h1 className="display text-3xl">Content</h1><p className="mt-1 text-sm text-slate">Homepage hero banner, promotional offers and testimonials. <Link href="/admin/vehicles?listing=featured" className="font-semibold underline">Manage featured vehicles ({featured})</Link></p></div>
      <Section title="Homepage banners" description="The first active banner (lowest order) powers the homepage hero." add={<ContentFormButton kind="banner" />}>
        {banners.map((b) => <Row key={b.id} img={b.imageUrl} title={b.title} sub={b.subtitle} active={b.active} actions={<><ContentFormButton kind="banner" id={b.id} values={b} /><ConfirmButton action={deleteContent.bind(null, "banner", b.id)} title="Delete banner?" description="This can't be undone." confirmLabel="Delete" variant="ghost">Delete</ConfirmButton></>} />)}
      </Section>
      <Section title="Promotional offers" description="Shown in the homepage ‘Special offers’ section while active and not expired." add={<ContentFormButton kind="promotion" />}>
        {promos.map((p) => <Row key={p.id} img={p.imageUrl} title={p.title} sub={`${p.badge ?? ""}${p.endsAt ? ` · ends ${formatDate(p.endsAt)}` : ""}`} active={p.active} actions={<><ContentFormButton kind="promotion" id={p.id} values={{ ...p, endsAt: p.endsAt?.toISOString().slice(0, 10) }} /><ConfirmButton action={deleteContent.bind(null, "promotion", p.id)} title="Delete offer?" description="This can't be undone." confirmLabel="Delete" variant="ghost">Delete</ConfirmButton></>} />)}
      </Section>
      <Section title="Testimonials" description="Rotating client stories on the homepage." add={<ContentFormButton kind="testimonial" />}>
        {testimonials.map((t) => <Row key={t.id} title={`${t.name} — “${t.quote.slice(0, 70)}…”`} sub={t.title} active={t.active} actions={<><ContentFormButton kind="testimonial" id={t.id} values={t} /><ConfirmButton action={deleteContent.bind(null, "testimonial", t.id)} title="Delete testimonial?" description="This can't be undone." confirmLabel="Delete" variant="ghost">Delete</ConfirmButton></>} />)}
      </Section>
    </div>
  );
}
