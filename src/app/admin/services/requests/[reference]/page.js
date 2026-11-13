import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Download, Phone, Mail, Clock3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS, SERVICE_STATUS_LABELS, SERVICE_STATUS_TONES } from "@/lib/constants";
import { formatDateTime, formatKES } from "@/lib/format";
import { privateFileUrl } from "@/lib/utils";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateServiceRequestAction } from "@/actions/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Service request details" };

function fileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminServiceRequestDetailPage({ params, searchParams }) {
  await requirePermission(PERMISSIONS.SERVICES_MANAGE, "/admin/services/requests");
  const { reference } = await params;
  const query = await searchParams;

  const [request, assignees] = await Promise.all([
    prisma.serviceRequest.findUnique({
      where: { reference },
      include: {
        service: true,
        documents: { orderBy: { createdAt: "asc" } },
        statusHistory: {
          orderBy: { createdAt: "asc" },
          include: { changedBy: { select: { name: true } } },
        },
        assignedTo: { select: { id: true, name: true } },
        user: { select: { id: true } },
      },
    }),
    prisma.user.findMany({
      where: { isActive: true, role: { name: { in: ["ADMIN", "STAFF", "TECHNICIAN"] } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: { select: { name: true } } },
    }),
  ]);

  if (!request) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/admin/services/requests"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-brand"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All service requests
      </Link>
      <AdminFlash searchParams={query} />

      <AdminHeader
        title={request.service.name}
        description={`${request.reference} · submitted ${formatDateTime(request.createdAt)}`}
        actions={
          <Badge tone={SERVICE_STATUS_TONES[request.status]}>
            {SERVICE_STATUS_LABELS[request.status]}
          </Badge>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr] xl:items-start">
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-sm font-semibold">Instructions</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate">
              {request.instructions}
            </p>
            <p className="mt-3 text-xs text-slate">
              {request.pages != null ? `${request.pages} pages · ` : ""}
              {request.copies != null ? `${request.copies} copies · ` : ""}
              {request.outputFormat ? `Format: ${request.outputFormat}` : "No output format specified"}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-sm font-semibold">Update request</h2>
            <form action={updateServiceRequestAction} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="requestId" value={request.id} />
              <input type="hidden" name="reference" value={request.reference} />
              <Field label="Status" htmlFor="status">
                <Select id="status" name="status" defaultValue={request.status}>
                  {Object.entries(SERVICE_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Assigned to" htmlFor="assigneeId">
                <Select id="assigneeId" name="assigneeId" defaultValue={request.assignedToId || ""}>
                  <option value="">Unassigned</option>
                  {assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name} ({assignee.role.name.toLowerCase()})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Quote amount (KES)" htmlFor="quoteAmount">
                <Input
                  id="quoteAmount"
                  name="quoteAmount"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={request.quoteAmount ?? ""}
                  placeholder="e.g. 1500"
                />
              </Field>
              <Field label="Customer-visible note" htmlFor="note" hint="Added to the request timeline.">
                <Input id="note" name="note" placeholder="e.g. Quote ready for approval" maxLength={1000} />
              </Field>
              <Field label="Internal notes" htmlFor="internalNotes" className="sm:col-span-2">
                <Textarea
                  id="internalNotes"
                  name="internalNotes"
                  rows={3}
                  defaultValue={request.internalNotes || ""}
                  placeholder="Only visible to staff."
                />
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton pendingText="Updating request…">Save request</SubmitButton>
              </div>
            </form>
          </div>

          {request.documents.length > 0 ? (
            <div className="rounded-xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-brand" /> Customer documents
              </h2>
              <ul className="mt-3 divide-y divide-line">
                {request.documents.map((document) => (
                  <li key={document.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {document.originalName}
                      </p>
                      <p className="text-[11px] text-slate">
                        {fileSize(document.size)} · {formatDateTime(document.createdAt)}
                      </p>
                    </div>
                    <a
                      href={privateFileUrl(document.storageKey)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand"
                    >
                      <Download className="h-3.5 w-3.5" /> Open
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Clock3 className="h-4 w-4 text-brand" /> History
            </h2>
            <ol className="mt-3 space-y-3">
              {request.statusHistory.map((entry, index) => (
                <li key={entry.id} className="flex gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      index === request.statusHistory.length - 1 ? "bg-brand" : "bg-line"
                    }`}
                  />
                  <div>
                    <p className="text-[13px] font-medium text-ink">
                      {SERVICE_STATUS_LABELS[entry.status]}
                    </p>
                    {entry.note ? <p className="text-xs leading-5 text-slate">{entry.note}</p> : null}
                    <p className="text-[11px] text-slate/80">
                      {formatDateTime(entry.createdAt)}
                      {entry.changedBy?.name ? ` · ${entry.changedBy.name}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-white p-5 text-sm">
            <h2 className="font-semibold">Customer</h2>
            <p className="mt-2 font-medium text-ink">{request.customerName}</p>
            <div className="mt-2 space-y-1.5 text-xs text-slate">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-brand" /> {request.phone}
              </p>
              {request.email ? (
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-brand" /> {request.email}
                </p>
              ) : null}
              {request.user ? (
                <Link
                  href={`/admin/customers/${request.user.id}`}
                  className="inline-flex pt-1 font-semibold text-brand"
                >
                  View customer account
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-5 text-sm">
            <h2 className="font-semibold">Request summary</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Reference</dt>
                <dd className="font-mono font-medium text-ink">{request.reference}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Service</dt>
                <dd className="text-right font-medium text-ink">{request.service.name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Quote</dt>
                <dd className="font-medium text-ink">
                  {request.quoteAmount != null
                    ? formatKES(request.quoteAmount)
                    : request.service.priceFrom != null
                      ? `From ${formatKES(request.service.priceFrom)}`
                      : "Not set"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Assigned</dt>
                <dd className="text-right font-medium text-ink">
                  {request.assignedTo?.name || "Unassigned"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Last update</dt>
                <dd className="text-right font-medium text-ink">
                  {formatDateTime(request.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
