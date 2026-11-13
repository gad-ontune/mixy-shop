import Link from "next/link";
import { Plus, Sparkles, Trash2, Save, Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/constants";
import { formatKES, formatNumber } from "@/lib/format";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  saveDigitalServiceAction,
  deleteDigitalServiceAction,
} from "@/actions/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Digital services" };

export default async function AdminServicesPage({ searchParams }) {
  await requirePermission(PERMISSIONS.SERVICES_MANAGE, "/admin/services");
  const params = await searchParams;

  const [services, openRequests] = await Promise.all([
    prisma.digitalService.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { requests: true } } },
    }),
    prisma.serviceRequest.count({
      where: { NOT: { status: { in: ["COMPLETED", "CANCELLED"] } } },
    }),
  ]);

  return (
    <div className="space-y-5">
      <AdminFlash searchParams={params} />
      <AdminHeader
        title="Digital services"
        description={`${services.length} services · ${formatNumber(openRequests)} open request${openRequests === 1 ? "" : "s"}.`}
        actions={
          <Link href="/admin/services/requests" className={buttonVariants({ variant: "outline" })}>
            <Inbox className="h-4 w-4" /> Service requests
          </Link>
        }
      />

      <div className="rounded-xl border border-line bg-white">
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-brand" /> Add a service
          </h2>
        </div>
        <div className="bg-soft/40 p-5">
          <form action={saveDigitalServiceAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Service name" required htmlFor="new-service-name">
              <Input id="new-service-name" name="name" placeholder="Document printing" required />
            </Field>
            <Field label="Price from (KES)" htmlFor="new-service-price">
              <Input id="new-service-price" name="priceFrom" type="number" min="0" placeholder="Optional" />
            </Field>
            <Field label="Unit" htmlFor="new-service-unit">
              <Input id="new-service-unit" name="unit" placeholder="page, document, design" />
            </Field>
            <Field label="Sort order" htmlFor="new-service-sort">
              <Input id="new-service-sort" name="sortOrder" type="number" min="0" defaultValue={0} />
            </Field>
            <Field label="Description" required htmlFor="new-service-description" className="sm:col-span-2 lg:col-span-3">
              <Textarea id="new-service-description" name="description" rows={2} maxLength={2000} required />
            </Field>
            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked
                  className="h-4 w-4 rounded border-line text-brand"
                />
                Active
              </label>
              <SubmitButton pendingText="Saving…">
                <Plus className="h-4 w-4" /> Add service
              </SubmitButton>
            </div>
          </form>
        </div>

        <ul className="divide-y divide-line">
          {services.map((service) => (
            <li key={service.id} className="px-5 py-4">
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{service.name}</p>
                    <p className="text-[11px] text-slate">
                      {service.priceFrom != null
                        ? `From ${formatKES(service.priceFrom)} / ${service.unit}`
                        : `Priced per ${service.unit}`}
                      {" · "}
                      {service._count.requests} request{service._count.requests === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={service.isActive ? "green" : "slate"}>
                      {service.isActive ? "Active" : "Hidden"}
                    </Badge>
                    <span className="text-[11px] font-medium text-brand">Edit</span>
                  </div>
                </summary>

                <form action={saveDigitalServiceAction} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <input type="hidden" name="serviceId" value={service.id} />
                  <Field label="Service name" htmlFor={`svc-name-${service.id}`}>
                    <Input id={`svc-name-${service.id}`} name="name" defaultValue={service.name} required />
                  </Field>
                  <Field label="Price from (KES)" htmlFor={`svc-price-${service.id}`}>
                    <Input
                      id={`svc-price-${service.id}`}
                      name="priceFrom"
                      type="number"
                      min="0"
                      defaultValue={service.priceFrom ?? ""}
                    />
                  </Field>
                  <Field label="Unit" htmlFor={`svc-unit-${service.id}`}>
                    <Input id={`svc-unit-${service.id}`} name="unit" defaultValue={service.unit} />
                  </Field>
                  <Field label="Sort order" htmlFor={`svc-sort-${service.id}`}>
                    <Input
                      id={`svc-sort-${service.id}`}
                      name="sortOrder"
                      type="number"
                      min="0"
                      defaultValue={service.sortOrder}
                    />
                  </Field>
                  <Field
                    label="Description"
                    htmlFor={`svc-desc-${service.id}`}
                    className="sm:col-span-2 lg:col-span-4"
                  >
                    <Textarea
                      id={`svc-desc-${service.id}`}
                      name="description"
                      rows={2}
                      defaultValue={service.description}
                      maxLength={2000}
                    />
                  </Field>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={service.isActive}
                        className="h-4 w-4 rounded border-line text-brand"
                      />
                      Active
                    </label>
                    <SubmitButton size="sm" pendingText="Saving…">
                      <Save className="h-3.5 w-3.5" /> Save
                    </SubmitButton>
                  </div>
                </form>

                {service._count.requests === 0 ? (
                  <form action={deleteDigitalServiceAction} className="mt-2">
                    <input type="hidden" name="serviceId" value={service.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3 w-3" /> Delete service
                    </button>
                  </form>
                ) : null}
              </details>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
