"use client";
import { useActionState } from "react";
import { submitEnquiry } from "@/actions/engagement";
import { Input, Select, Textarea, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function EnquiryForm({ vehicleId, defaultSubject, user, defaultType = "VEHICLE_INFO", compact }: { vehicleId?: string; defaultSubject?: string; user?: { name: string; email: string; phone: string | null } | null; defaultType?: string; compact?: boolean }) {
  const [state, action] = useActionState(submitEnquiry, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  const e = state?.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      {vehicleId && <input type="hidden" name="vehicleId" value={vehicleId} />}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" name="name" defaultValue={user?.name} error={e.name} autoComplete="name" required />
        <Input label="Email" name="email" type="email" defaultValue={user?.email} error={e.email} autoComplete="email" required />
        <Input label="Phone" name="phone" type="tel" defaultValue={user?.phone ?? ""} error={e.phone} autoComplete="tel" optional />
        <Select label="Enquiry type" name="type" defaultValue={defaultType} error={e.type}>
          <option value="VEHICLE_INFO">Vehicle information</option>
          <option value="TEST_DRIVE">Book a test drive / viewing</option>
          <option value="FINANCING">Financing & trade-in</option>
          <option value="RENTAL">Rental enquiry</option>
          <option value="GENERAL">General</option>
        </Select>
      </div>
      <Input label="Subject" name="subject" defaultValue={defaultSubject} error={e.subject} required />
      <Textarea label="Message" name="message" rows={compact ? 3 : 5} error={e.message} placeholder="Tell us what you'd like to know — inspection reports, viewing times, financing…" required />
      <SubmitButton className="w-full sm:w-auto" pendingText="Sending…">Send enquiry</SubmitButton>
    </form>
  );
}
