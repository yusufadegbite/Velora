"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { forgotPasswordAction, loginAction, registerAction, resetPasswordAction } from "@/actions/auth";
import { Input, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

function PasswordInput({ name, label, error, autoComplete, hint }: { name: string; label: string; error?: string; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input label={label} name={name} type={show ? "text" : "password"} error={error} autoComplete={autoComplete} hint={hint} required />
      <button type="button" onClick={() => setShow(!show)} className="absolute top-[2.05rem] right-3 p-1 text-slate hover:text-midnight" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function GoogleButton({ next }: { next: string }) {
  return (
    <>
      <a href={`/api/auth/google?next=${encodeURIComponent(next)}`} className="flex h-11 w-full items-center justify-center gap-3 border border-line bg-white text-sm font-semibold transition hover:border-midnight">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden><path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8.1z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>
        Continue with Google
      </a>
      <div className="my-6 flex items-center gap-4 text-xs text-slate"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
    </>
  );
}

export function LoginForm({ next, googleEnabled, notice }: { next: string; googleEnabled: boolean; notice?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <>
      {googleEnabled && <GoogleButton next={next} />}
      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={next} />
        {notice && !state && <FormMessage state={{ ok: false, message: notice }} />}
        <FormMessage state={state} />
        <Input label="Email" name="email" type="email" autoComplete="email" error={state?.errors?.email} required autoFocus />
        <PasswordInput label="Password" name="password" autoComplete="current-password" error={state?.errors?.password} />
        <div className="flex justify-end"><Link href="/forgot-password" className="text-xs font-semibold text-slate hover:text-midnight">Forgot password?</Link></div>
        <SubmitButton size="lg" variant="dark" className="w-full" pendingText="Signing in…">Sign in</SubmitButton>
      </form>
    </>
  );
}

export function RegisterForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const [state, action] = useActionState(registerAction, undefined);
  const e = state?.errors ?? {};
  return (
    <>
      {googleEnabled && <GoogleButton next={next} />}
      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={next} />
        <FormMessage state={state} />
        <Input label="Full name" name="name" autoComplete="name" error={e.name} required autoFocus />
        <Input label="Email" name="email" type="email" autoComplete="email" error={e.email} required />
        <Input label="Phone" name="phone" type="tel" autoComplete="tel" error={e.phone} optional />
        <PasswordInput label="Password" name="password" autoComplete="new-password" error={e.password} hint="At least 8 characters with a letter and a number." />
        <PasswordInput label="Confirm password" name="confirmPassword" autoComplete="new-password" error={e.confirmPassword} />
        <SubmitButton size="lg" variant="dark" className="w-full" pendingText="Creating account…">Create account</SubmitButton>
        <p className="text-xs text-slate">By creating an account you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
      </form>
    </>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(forgotPasswordAction, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <Input label="Email" name="email" type="email" autoComplete="email" error={state?.errors?.email} required autoFocus />
      <SubmitButton size="lg" variant="dark" className="w-full" pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, undefined);
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      <PasswordInput label="New password" name="password" autoComplete="new-password" error={state?.errors?.password} hint="At least 8 characters with a letter and a number." />
      <PasswordInput label="Confirm new password" name="confirmPassword" autoComplete="new-password" error={state?.errors?.confirmPassword} />
      <SubmitButton size="lg" variant="dark" className="w-full" pendingText="Saving…">Set new password</SubmitButton>
    </form>
  );
}
