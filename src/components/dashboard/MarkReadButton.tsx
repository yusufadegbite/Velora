"use client";
import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { markNotificationsRead } from "@/actions/account";
import { Button } from "@/components/ui/Button";

export function MarkReadButton() {
  const [pending, start] = useTransition();
  return <Button variant="outline" size="sm" disabled={pending} onClick={() => start(async () => { await markNotificationsRead(); })}><CheckCheck className="size-4" />Mark all as read</Button>;
}
