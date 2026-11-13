"use client";

import { useActionState } from "react";
import { AlertCircle, FileUp, ShieldCheck } from "lucide-react";
import { submitServiceRequestAction } from "@/actions/services";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatKES } from "@/lib/format";

export function ServiceRequestForm({ services, user }) {
  const [state, formAction] = useActionState(submitServiceRequestAction, null);

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
        <Field label="Phone number" required htmlFor="phone">
          <Input id="phone" name="phone" type="tel" defaultValue={user?.phone || ""} autoComplete="tel" placeholder="0712 345 678" required />
        </Field>
        <Field label="Email" htmlFor="email" hint="Optional — useful for quotes and updates." className="sm:col-span-2">
          <Input id="email" name="email" type="email" defaultValue={user?.email || ""} autoComplete="email" placeholder="you@example.com" />
        </Field>
      </div>

      <Field label="Service" required htmlFor="serviceId">
        <Select id="serviceId" name="serviceId" required defaultValue="">
          <option value="" disabled>Select the service you need</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
              {service.priceFrom != null ? ` — from ${formatKES(service.priceFrom)} per ${service.unit}` : ""}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Instructions"
        required
        htmlFor="instructions"
        hint="Tell us exactly what you need. Mention colours, paper size, formatting or deadlines where relevant."
      >
        <Textarea
          id="instructions"
          name="instructions"
          rows={5}
          required
          minLength={10}
          placeholder="For example: Print 3 copies of the attached 12-page proposal in colour on A4, stapled."
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Number of pages" htmlFor="pages">
          <Input id="pages" name="pages" type="number" min="0" max="10000" placeholder="e.g. 12" />
        </Field>
        <Field label="Number of copies" htmlFor="copies">
          <Input id="copies" name="copies" type="number" min="0" max="1000" placeholder="e.g. 3" />
        </Field>
        <Field label="Output format" htmlFor="outputFormat">
          <Input id="outputFormat" name="outputFormat" placeholder="e.g. PDF, A4 colour" />
        </Field>
      </div>

      <Field
        label="Documents"
        htmlFor="documents"
        hint="Optional. Up to 3 files: PDF, Word, PNG, JPG or TXT. Max 10MB each. Files are stored privately."
      >
        <div className="relative">
          <Input
            id="documents"
            name="documents"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
            className="h-11 cursor-pointer py-2 file:mr-3 file:rounded-md file:border-0 file:bg-soft file:px-3 file:py-1.5 file:text-xs file:font-medium"
          />
          <FileUp className="pointer-events-none absolute right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate sm:block" />
        </div>
      </Field>

      <div className="rounded-xl border border-line bg-brand-50/50 p-4">
        <label className="flex items-start gap-3 text-sm text-slate">
          <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand" />
          <span>
            I agree that MIX may access and process the uploaded document only to complete this
            request. I understand that a quote may be provided before work begins.
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton size="lg" pendingText="Submitting request…">
          Send service request
        </SubmitButton>
        <p className="flex items-center gap-1.5 text-xs text-slate">
          <ShieldCheck className="h-4 w-4 text-brand" /> Documents are restricted to authorized staff.
        </p>
      </div>
    </form>
  );
}
