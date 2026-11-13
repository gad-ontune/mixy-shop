"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { registerAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, null);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? (
        <Alert tone="red">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
          </span>
        </Alert>
      ) : null}

      <Field label="Full name" required htmlFor="name">
        <Input id="name" name="name" autoComplete="name" placeholder="e.g. Brian Otieno" required />
      </Field>

      <Field label="Email address" required htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </Field>

      <Field label="Phone number" required htmlFor="phone" hint="We use this for order and repair updates.">
        <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0712 345 678" required />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Password" required htmlFor="password" hint="At least 8 characters with a letter and number.">
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        </Field>
        <Field label="Confirm password" required htmlFor="confirmPassword">
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
        </Field>
      </div>

      <p className="text-xs leading-5 text-slate">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="font-medium text-brand hover:underline">terms</Link> and{" "}
        <Link href="/privacy" className="font-medium text-brand hover:underline">privacy notice</Link>.
      </p>

      <SubmitButton size="lg" className="w-full" pendingText="Creating your account…">
        Create account
      </SubmitButton>

      <p className="text-center text-sm text-slate">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
