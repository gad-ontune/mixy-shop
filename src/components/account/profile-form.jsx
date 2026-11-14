"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, UserRound } from "lucide-react";
import { updateProfileAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProfileForm({ user }) {
  const [state, formAction] = useActionState(updateProfileAction, null);
  const profile = user.customerProfile || {};

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? (
        <Alert tone="red">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
          </span>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert tone="green" title="Saved">
          <span className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {state.message}
          </span>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required htmlFor="name">
          <Input id="name" name="name" defaultValue={user.name || ""} autoComplete="name" required />
        </Field>
        <Field
          label="Phone number"
          htmlFor="phone"
          hint="Used for order, repair and delivery updates."
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={user.phone || profile.defaultPhone || ""}
            autoComplete="tel"
            placeholder="0712 345 678"
          />
        </Field>
        <Field
          label="Delivery address"
          htmlFor="addressLine"
          className="sm:col-span-2"
          hint="Optional default address to make checkout faster."
        >
          <Input
            id="addressLine"
            name="addressLine"
            defaultValue={profile.addressLine || ""}
            autoComplete="street-address"
            placeholder="Area, street, building, house number"
          />
        </Field>
        <Field label="Town or city" htmlFor="city">
          <Input
            id="city"
            name="city"
            defaultValue={profile.city || ""}
            autoComplete="address-level2"
            placeholder="Kehancha"
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingText="Saving…">
          <UserRound className="h-4 w-4" /> Save changes
        </SubmitButton>
        <p className="text-xs text-slate">
          Your email address cannot be changed here. Contact MIX if you need help with your account.
        </p>
      </div>
    </form>
  );
}
