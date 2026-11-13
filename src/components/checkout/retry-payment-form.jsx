"use client";

import { useActionState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { retryOrderPaymentAction } from "@/actions/checkout";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function RetryPaymentForm({ order }) {
  const [state, formAction] = useActionState(retryOrderPaymentAction, null);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      {state?.error ? (
        <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
        </p>
      ) : null}

      <input type="hidden" name="orderId" value={order.id} />
      <input type="hidden" name="accessToken" value={order.accessToken} />

      <Field label="M-PESA phone number" htmlFor="retry-phone" required>
        <Input
          id="retry-phone"
          name="phone"
          type="tel"
          defaultValue={order.phone}
          placeholder="0712 345 678"
          required
        />
      </Field>

      <SubmitButton pendingText="Sending new prompt…">
        <RefreshCw className="h-4 w-4" /> Retry M-PESA payment
      </SubmitButton>
      <p className="text-[11px] leading-5 text-slate">
        Retrying may reserve the items again if stock was released. If an item is no longer
        available, you will be asked to review your cart.
      </p>
    </form>
  );
}
