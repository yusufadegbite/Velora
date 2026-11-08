"use client";
import { useActionState } from "react";
import { changePasswordAction, updateProfileAction } from "@/actions/account";
import { Input, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ProfileForm({ user }: { user: { name: string; email: string; phone: string | null } }) {
  const [state, action] = useActionState(updateProfileAction, undefined);
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <Input label="Full name" name="name" defaultValue={user.name} error={state?.errors?.name} autoComplete="name" />
      <Input label="Email" name="email" defaultValue={user.email} disabled hint="Contact support to change your email address." />
      <Input label="Phone" name="phone" type="tel" defaultValue={user.phone ?? ""} error={state?.errors?.phone} optional autoComplete="tel" />
      <SubmitButton variant="dark" pendingText="Saving…">Save changes</SubmitButton>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action] = useActionState(changePasswordAction, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate key={state?.ok ? "done" : "form"}>
      <FormMessage state={state} />
      {hasPassword ? <Input label="Current password" name="currentPassword" type="password" autoComplete="current-password" error={e.currentPassword} /> : <input type="hidden" name="currentPassword" value="" />}
      <Input label="New password" name="newPassword" type="password" autoComplete="new-password" error={e.newPassword} hint="At least 8 characters with a letter and a number." />
      <Input label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" error={e.confirmPassword} />
      <SubmitButton variant="dark" pendingText="Updating…">Update password</SubmitButton>
    </form>
  );
}
