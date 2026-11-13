"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { requestPasswordResetAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, null);

  if (state?.ok) {
    return (
      <div className="space-y-5">
        <Alert tone="green" title="Check your email">
          {state.message}
        </Alert>
        {state.devLink ? (
          <div className="rounded-xl border border-dashed border-brand/30 bg-brand-50/60 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Development reset link</p>
            <Link href={state.devLink} className="mt-1 block break-all text-[13px] font-medium text-brand underline">
              {state.devLink}
            </Link>
            <p className="mt-2 text-xs text-slate">
              Email is not configured in this environment, so the link is shown here. In production
              it is sent by email only.
            </p>
          </div>
        ) : null}
        <Link href="/sign-in" className="block text-sm font-semibold text-brand hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? (
        <Alert tone="red">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
          </span>
        </Alert>
      ) : null}

      <Field label="Email address" required htmlFor="email" hint="Use the email on your MIX account.">
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </Field>

      <SubmitButton size="lg" className="w-full" pendingText="Sending link…">
        Send reset link
      </SubmitButton>

      <p className="text-center text-sm text-slate">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
