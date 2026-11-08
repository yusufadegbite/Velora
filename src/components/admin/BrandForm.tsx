"use client";
import { useActionState, useEffect, useState } from "react";
import { saveBrandAction } from "@/actions/admin";
import { Input, Textarea, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

type Brand = { id: string; name: string; country: string | null; description: string | null; logoUrl: string | null; heroImage: string | null };

export function BrandFormButton({ brand }: { brand?: Brand }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(saveBrandAction.bind(null, brand?.id ?? null), undefined);
  useEffect(() => { if (state?.ok) setOpen(false); }, [state]);
  const e = state?.errors ?? {};
  return (
    <>
      {brand ? <button onClick={() => setOpen(true)} className="text-xs font-semibold underline-offset-4 hover:underline">Edit</button> : <Button onClick={() => setOpen(true)}>Add brand</Button>}
      <Dialog open={open} onClose={() => setOpen(false)} title={brand ? `Edit ${brand.name}` : "Add brand"}>
        <form action={action} className="space-y-4" noValidate>
          <FormMessage state={state?.ok ? undefined : state} />
          <Input label="Name" name="name" defaultValue={brand?.name} error={e.name} />
          <Input label="Country" name="country" defaultValue={brand?.country ?? ""} optional />
          <Textarea label="Description" name="description" defaultValue={brand?.description ?? ""} rows={3} optional />
          <Input label="Hero image URL" name="heroImage" defaultValue={brand?.heroImage ?? ""} error={e.heroImage} optional />
          <Input label="Logo URL" name="logoUrl" defaultValue={brand?.logoUrl ?? ""} error={e.logoUrl} optional />
          <SubmitButton variant="dark" pendingText="Saving…">Save brand</SubmitButton>
        </form>
      </Dialog>
    </>
  );
}
