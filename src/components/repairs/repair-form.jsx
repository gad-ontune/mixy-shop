"use client";

import { useActionState } from "react";
import { AlertCircle, Camera, ShieldCheck, Wrench } from "lucide-react";
import { submitRepairAction } from "@/actions/repairs";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { REPAIR_DEVICE_TYPES } from "@/lib/constants";
import { Alert } from "@/components/ui/alert";

export function RepairForm({ user, brands }) {
  const [state, formAction] = useActionState(submitRepairAction, null);

  return (
    <form action={formAction} className="space-y-6" encType="multipart/form-data">
      {state?.error ? (
        <Alert tone="red" title="Could not submit the request">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
          </span>
        </Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required htmlFor="customerName">
          <Input id="customerName" name="customerName" defaultValue={user?.name || ""} autoComplete="name" required />
        </Field>
        <Field label="Phone number" required htmlFor="phone" hint="We will use this to contact you about the repair.">
          <Input id="phone" name="phone" type="tel" defaultValue={user?.phone || ""} autoComplete="tel" placeholder="0712 345 678" required />
        </Field>
        <Field label="Email" htmlFor="email" hint="Optional — useful for written updates." className="sm:col-span-2">
          <Input id="email" name="email" type="email" defaultValue={user?.email || ""} autoComplete="email" placeholder="you@example.com" />
        </Field>
      </div>

      <div className="rounded-xl border border-line bg-soft/40 p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-semibold text-ink">Your device</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Device type" required htmlFor="deviceType">
            <Select id="deviceType" name="deviceType" defaultValue="Smartphone" required>
              {REPAIR_DEVICE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </Field>
          <Field label="Brand" required htmlFor="deviceBrand">
            <Input id="deviceBrand" name="deviceBrand" list="repair-brands" placeholder="e.g. Samsung" required />
            <datalist id="repair-brands">
              {brands.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
          </Field>
          <Field label="Model" required htmlFor="deviceModel">
            <Input id="deviceModel" name="deviceModel" placeholder="e.g. Galaxy A54" required />
          </Field>
        </div>
      </div>

      <Field
        label="What is the problem?"
        required
        htmlFor="problemDescription"
        hint="Describe what happens, when it started, and anything you have already tried."
      >
        <Textarea
          id="problemDescription"
          name="problemDescription"
          rows={5}
          placeholder="For example: The screen cracked after a fall. The display works, but the touch is unreliable along the top edge."
          required
          minLength={15}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Preferred drop-off date" htmlFor="preferredDate" hint="Optional. The shop will confirm availability.">
          <Input id="preferredDate" name="preferredDate" type="date" min={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Device photos" htmlFor="photos" hint="Up to 4 images (JPG, PNG or WebP), max 5MB each.">
          <div className="relative">
            <Input id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="h-11 cursor-pointer py-2 file:mr-3 file:rounded-md file:border-0 file:bg-soft file:px-3 file:py-1.5 file:text-xs file:font-medium" />
            <Camera className="pointer-events-none absolute right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate sm:block" />
          </div>
        </Field>
      </div>

      <Field label="Anything else we should know?" htmlFor="additionalInfo">
        <Textarea id="additionalInfo" name="additionalInfo" rows={3} placeholder="Accessories included, previous repairs, urgency, or other details." />
      </Field>

      <div className="rounded-xl border border-line bg-brand-50/50 p-4">
        <label className="flex items-start gap-3 text-sm text-slate">
          <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand" />
          <span>
            I understand that submitting this form is a request, not a confirmed repair. MIX will
            diagnose the device and provide an estimate for approval before any repair work begins.
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton size="lg" pendingText="Submitting request…">
          Submit repair request
        </SubmitButton>
        <p className="flex items-center gap-1.5 text-xs text-slate">
          <ShieldCheck className="h-4 w-4 text-brand" /> Your details and photos are handled privately.
        </p>
      </div>
    </form>
  );
}
