"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { resetPasswordAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResetPasswordForm({ token }) {
  const [state, formAction] = useActionState(resetPasswordAction, null);

  if (state?.ok) {
    return (
      <div className="space-y-5">
        <Alert tone="green" title="Password updated">
          {state.message}
        </Alert>
        <Link href="/sign-in" className="inline-flex text-sm font-semibold text-brand hover:underline">
          Go to sign in
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

      <input type="hidden" name="token" value={token || ""} />

      <Field label="New password" required htmlFor="password" hint="At least 8 characters with a letter and number.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>

      <Field label="Confirm new password" required htmlFor="confirmPassword">
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
      </Field>

      <SubmitButton size="lg" className="w-full" pendingText="Updating password…">
        Update password
      </SubmitButton>

      <p className="text-center text-sm text-slate">
        Need a new link?{" "}
        <Link href="/forgot-password" className="font-semibold text-brand hover:underline">
          Request another
        </Link>
      </p>
    </form>
  );
}
