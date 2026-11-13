"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, LockKeyhole, Mail } from "lucide-react";
import { authenticate } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function SignInForm({ callbackUrl }) {
  const [state, formAction] = useActionState(authenticate, null);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? (
        <Alert tone="red">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
          </span>
        </Alert>
      ) : null}

      <input type="hidden" name="callbackUrl" value={callbackUrl || "/account"} />

      <Field label="Email or phone number" required htmlFor="identifier">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input
            id="identifier"
            name="identifier"
            autoComplete="username"
            placeholder="you@example.com or 0712 345 678"
            className="pl-9"
            required
          />
        </div>
      </Field>

      <Field label="Password" required htmlFor="password">
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            className="pl-9"
            required
          />
        </div>
      </Field>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate">Sign in with the account you use across MIX.</span>
        <Link href="/forgot-password" className="text-xs font-semibold text-brand hover:underline">
          Forgot password?
        </Link>
      </div>

      <SubmitButton size="lg" className="w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>

      <p className="text-center text-sm text-slate">
        New to MIX?{" "}
        <Link href="/register" className="font-semibold text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
