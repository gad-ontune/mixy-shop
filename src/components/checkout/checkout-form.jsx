"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  MapPin,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { createOrderAction } from "@/actions/checkout";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatKES } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CheckoutForm({ summary, settings, user }) {
  const [state, formAction] = useActionState(createOrderAction, null);
  const defaultMethod = settings.collectionEnabled ? "COLLECTION" : "DELIVERY";
  const [method, setMethod] = useState(defaultMethod);

  const deliveryFee =
    method === "DELIVERY" && settings.deliveryEnabled ? settings.deliveryFee : 0;
  const total = summary.subtotal + deliveryFee;

  const methods = [
    {
      value: "COLLECTION",
      label: "Shop collection",
      detail: settings.address,
      icon: Store,
      enabled: settings.collectionEnabled,
      price: "Free",
    },
    {
      value: "DELIVERY",
      label: "Delivery",
      detail: settings.deliveryCoverage || "Ask us about delivery coverage",
      icon: Truck,
      enabled: settings.deliveryEnabled,
      price: formatKES(settings.deliveryFee),
    },
  ];

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
      <div className="space-y-5">
        {state?.error ? (
          <Alert tone="red" title="We could not start your order">
            <span className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
            </span>
          </Alert>
        ) : null}

        {!settings.mpesaEnabled ? (
          <Alert tone="amber" title="Online payment is temporarily unavailable">
            M-PESA checkout is paused right now. Please contact MIX to complete your order.
          </Alert>
        ) : null}

        <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">Contact details</h2>
          <p className="mt-0.5 text-xs text-slate">
            We use these details for your order and payment updates.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required htmlFor="customerName">
              <Input
                id="customerName"
                name="customerName"
                defaultValue={user?.name || ""}
                autoComplete="name"
                required
              />
            </Field>
            <Field label="M-PESA phone number" required htmlFor="phone" hint="The STK prompt is sent to this number.">
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={user?.phone || ""}
                autoComplete="tel"
                placeholder="0712 345 678"
                required
              />
            </Field>
            <Field label="Email" htmlFor="email" hint="Optional — for receipts and updates." className="sm:col-span-2">
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user?.email || ""}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </Field>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">How would you like to receive it?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {methods.map((option) => {
              const disabled = !option.enabled;
              const selected = method === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "relative cursor-pointer rounded-xl border p-4 transition-colors",
                    selected ? "border-brand bg-brand-50/60 ring-1 ring-brand" : "border-line hover:border-brand/40",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <input
                    type="radio"
                    name="fulfilmentMethod"
                    value={option.value}
                    checked={selected}
                    disabled={disabled}
                    onChange={() => setMethod(option.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <option.icon className="h-4 w-4 text-brand" /> {option.label}
                    </span>
                    <span className="text-xs font-medium text-slate">{option.price}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-slate">
                    {disabled ? "Currently unavailable" : option.detail}
                  </p>
                  {selected ? <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-brand" /> : null}
                </label>
              );
            })}
          </div>

          {method === "DELIVERY" ? (
            <div className="mt-4 space-y-4 border-t border-line pt-4">
              <Field
                label="Delivery address"
                required
                htmlFor="deliveryAddress"
                hint="Include the area, street, building and any landmark."
              >
                <Textarea
                  id="deliveryAddress"
                  name="deliveryAddress"
                  rows={3}
                  required
                  placeholder="e.g. Kilimani, Argwings Kodhek Road, Sunrise Apartments, Block B"
                />
              </Field>
              <Field label="Delivery notes" htmlFor="deliveryNotes">
                <Textarea
                  id="deliveryNotes"
                  name="deliveryNotes"
                  rows={2}
                  placeholder="Gate instructions, best time to call, or anything the rider should know."
                />
              </Field>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <CreditCard className="h-4 w-4 text-brand" /> Payment
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate">
            You will receive an M-PESA payment prompt on{" "}
            <strong className="text-ink">the phone number above</strong>. Enter your M-PESA PIN on
            your phone to authorise the payment. MIX never asks for your PIN.
          </p>
          <div className="mt-3 rounded-lg border border-line bg-soft/50 px-3 py-2.5 text-xs leading-5 text-slate">
            We only confirm your order after the payment is verified on our server. Do not close
            the confirmation page while the payment is pending.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton
            size="lg"
            className="min-w-[220px]"
            pendingText="Starting M-PESA…"
            disabled={!settings.mpesaEnabled}
          >
            Pay {formatKES(total)} with M-PESA
          </SubmitButton>
          <Link href="/cart" className="text-sm font-medium text-brand hover:underline">
            Back to cart
          </Link>
        </div>
      </div>

      <aside className="sticky top-32 space-y-4">
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-base font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {summary.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block line-clamp-2 text-ink">{item.product.name}</span>
                  <span className="block text-xs text-slate">
                    {item.variant?.name ? `${item.variant.name} · ` : ""}Qty {item.quantity}
                  </span>
                </span>
                <span className="shrink-0 font-medium">{formatKES(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate">Subtotal</dt>
              <dd className="font-medium">{formatKES(summary.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate">Delivery</dt>
              <dd className="font-medium">
                {deliveryFee > 0 ? formatKES(deliveryFee) : method === "COLLECTION" ? "Free" : "—"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold">{formatKES(total)}</dd>
            </div>
          </dl>

          <div className="mt-4 space-y-2 border-t border-line pt-4 text-xs text-slate">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand" /> Payment verified server-side
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand" /> {settings.address}
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
