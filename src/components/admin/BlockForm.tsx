"use client";
import { useActionState } from "react";
import { addAvailabilityBlock } from "@/actions/admin";
import { FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function BlockForm({ vehicles }: { vehicles: { id: string; name: string }[] }) {
  const [state, action] = useActionState(async (prev: Parameters<typeof addAvailabilityBlock>[1], fd: FormData) => addAvailabilityBlock(String(fd.get("vehicleId")), prev, fd), undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr_auto] lg:items-end">
      <div className="sm:col-span-2 lg:col-span-6"><FormMessage state={state} /></div>
      <label className="text-xs font-semibold">Vehicle<select name="vehicleId" className="field mt-1 py-2" required>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
      <label className="text-xs font-semibold">From<input type="datetime-local" name="startsAt" className="field mt-1 py-2" required /></label>
      <label className="text-xs font-semibold">To<input type="datetime-local" name="endsAt" className="field mt-1 py-2" required /></label>
      <label className="text-xs font-semibold">Type<select name="type" className="field mt-1 py-2"><option value="MAINTENANCE">Maintenance</option><option value="BLOCKED">Blocked</option><option value="PRIVATE_USE">Private use</option></select></label>
      <label className="text-xs font-semibold">Reason<input name="reason" className="field mt-1 py-2" maxLength={200} /></label>
      <SubmitButton variant="dark" pendingText="Adding…">Block dates</SubmitButton>
    </form>
  );
}
