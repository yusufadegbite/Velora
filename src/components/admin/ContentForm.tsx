"use client";
import { useActionState, useEffect, useState } from "react";
import { saveContentAction } from "@/actions/admin";
import { Input, Textarea, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

type Kind = "banner" | "promotion" | "testimonial";
type Values = Record<string, string | number | boolean | Date | null | undefined>;

const FIELDS: Record<Kind, { name: string; label: string; type?: string; textarea?: boolean; optional?: boolean }[]> = {
  banner: [
    { name: "eyebrow", label: "Eyebrow", optional: true }, { name: "title", label: "Headline" }, { name: "subtitle", label: "Supporting text", textarea: true, optional: true },
    { name: "imageUrl", label: "Background image URL" }, { name: "ctaLabel", label: "Button label", optional: true }, { name: "ctaHref", label: "Button link", optional: true }, { name: "position", label: "Order", type: "number" },
  ],
  promotion: [
    { name: "title", label: "Title" }, { name: "description", label: "Description", textarea: true }, { name: "badge", label: "Badge", optional: true },
    { name: "imageUrl", label: "Image URL" }, { name: "ctaLabel", label: "Button label", optional: true }, { name: "ctaHref", label: "Link", optional: true }, { name: "endsAt", label: "Ends on", type: "date", optional: true },
  ],
  testimonial: [
    { name: "name", label: "Customer name" }, { name: "title", label: "Context (e.g. Purchased a Lexus LX)", optional: true }, { name: "quote", label: "Quote", textarea: true },
    { name: "rating", label: "Rating (1–5)", type: "number" }, { name: "position", label: "Order", type: "number" },
  ],
};

export function ContentFormButton({ kind, id, values }: { kind: Kind; id?: string; values?: Values }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(saveContentAction.bind(null, kind, id ?? null), undefined);
  useEffect(() => { if (state?.ok) setOpen(false); }, [state]);
  const v = values ?? { position: 0, rating: 5, active: true };
  return (
    <>
      {id ? <button onClick={() => setOpen(true)} className="text-xs font-semibold underline-offset-4 hover:underline">Edit</button> : <Button size="sm" variant="dark" onClick={() => setOpen(true)}>Add {kind}</Button>}
      <Dialog open={open} onClose={() => setOpen(false)} title={`${id ? "Edit" : "Add"} ${kind}`} className="max-w-xl">
        <form action={action} className="space-y-4" noValidate>
          <FormMessage state={state?.ok ? undefined : state} />
          {FIELDS[kind].map((f) => f.textarea
            ? <Textarea key={f.name} label={f.label} name={f.name} rows={3} defaultValue={String(v[f.name] ?? "")} error={state?.errors?.[f.name]} optional={f.optional} />
            : <Input key={f.name} label={f.label} name={f.name} type={f.type ?? "text"} defaultValue={String(v[f.name] ?? "")} error={state?.errors?.[f.name]} optional={f.optional} />)}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={Boolean(v.active)} className="size-4 accent-[#10151C]" />Active (visible on the site)</label>
          <SubmitButton variant="dark" pendingText="Saving…">Save</SubmitButton>
        </form>
      </Dialog>
    </>
  );
}
