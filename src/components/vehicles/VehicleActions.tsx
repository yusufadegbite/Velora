"use client";
import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { EnquiryForm } from "./EnquiryForm";

export function RequestInfoButton({ vehicleId, vehicleName, user }: { vehicleId: string; vehicleName: string; user: { name: string; email: string; phone: string | null } | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 border border-midnight/20 px-5 text-sm font-semibold transition hover:border-midnight">
        <MessageSquareText className="size-4" /> Request More Information
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Enquire about the ${vehicleName}`} className="max-w-2xl">
        <EnquiryForm vehicleId={vehicleId} defaultSubject={`Enquiry: ${vehicleName}`} user={user} compact />
      </Dialog>
    </>
  );
}
