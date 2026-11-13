import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, ImageIcon, ClipboardCheck, Clock3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS, REPAIR_STATUS_LABELS, REPAIR_STATUS_TONES } from "@/lib/constants";
import { formatDate, formatDateTime, formatKES } from "@/lib/format";
import { privateFileUrl } from "@/lib/utils";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateRepairAction } from "@/actions/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Repair details" };

export default async function AdminRepairDetailPage({ params, searchParams }) {
  await requirePermission(PERMISSIONS.REPAIRS_MANAGE, "/admin/repairs");
  const { reference } = await params;
  const query = await searchParams;

  const [repair, technicians] = await Promise.all([
    prisma.repairRequest.findUnique({
      where: { reference },
      include: {
        images: { orderBy: { createdAt: "asc" } },
        diagnoses: {
          orderBy: { createdAt: "desc" },
          include: { technician: { select: { name: true } } },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
          include: { changedBy: { select: { name: true } } },
        },
        assignedTechnician: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: { in: ["TECHNICIAN", "ADMIN", "STAFF"] } },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: { select: { name: true } } },
    }),
  ]);

  if (!repair) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/admin/repairs"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-brand"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All repairs
      </Link>
      <AdminFlash searchParams={query} />

      <AdminHeader
        title={`${repair.deviceBrand} ${repair.deviceModel}`}
        description={`${repair.reference} · submitted ${formatDateTime(repair.createdAt)}`}
        actions={
          <Badge tone={REPAIR_STATUS_TONES[repair.status]}>
            {REPAIR_STATUS_LABELS[repair.status]}
          </Badge>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr] xl:items-start">
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-sm font-semibold">Reported problem</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate">
              {repair.problemDescription}
            </p>
            {repair.additionalInfo ? (
              <p className="mt-3 whitespace-pre-line border-t border-line pt-3 text-sm leading-6 text-slate">
                {repair.additionalInfo}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-slate">
              Device type: {repair.deviceType || "—"}
              {repair.preferredDate ? ` · Preferred date: ${formatDate(repair.preferredDate)}` : ""}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-sm font-semibold">Update repair</h2>
            <form action={updateRepairAction} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="repairId" value={repair.id} />
              <input type="hidden" name="reference" value={repair.reference} />
              <Field label="Status" htmlFor="status">
                <Select id="status" name="status" defaultValue={repair.status}>
                  {Object.entries(REPAIR_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Assigned technician" htmlFor="technicianId">
                <Select
                  id="technicianId"
                  name="technicianId"
                  defaultValue={repair.assignedTechnicianId || ""}
                >
                  <option value="">Unassigned</option>
                  {technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.name} ({technician.role.name.toLowerCase()})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Estimate amount (KES)" htmlFor="estimateAmount">
                <Input
                  id="estimateAmount"
                  name="estimateAmount"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={repair.estimateAmount ?? ""}
                  placeholder="e.g. 2500"
                />
              </Field>
              <Field label="Customer-visible note" htmlFor="note" hint="Added to the repair timeline.">
                <Input id="note" name="note" placeholder="e.g. Ready for collection" maxLength={1000} />
              </Field>
              <Field label="Diagnosis" htmlFor="diagnosis" className="sm:col-span-2">
                <Textarea
                  id="diagnosis"
                  name="diagnosis"
                  rows={3}
                  defaultValue={repair.diagnosis || ""}
                  placeholder="Findings shared with the customer."
                />
              </Field>
              <Field label="Internal notes" htmlFor="internalNotes" className="sm:col-span-2">
                <Textarea
                  id="internalNotes"
                  name="internalNotes"
                  rows={3}
                  defaultValue={repair.internalNotes || ""}
                  placeholder="Only visible to staff."
                />
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton pendingText="Updating repair…">Save repair</SubmitButton>
              </div>
            </form>
            <p className="mt-2 text-[11px] leading-5 text-slate">
              Changing the diagnosis adds a diagnosis entry. The customer receives an in-app
              notification for status updates.
            </p>
          </div>

          {repair.images.length > 0 ? (
            <div className="rounded-xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <ImageIcon className="h-4 w-4 text-brand" /> Customer photos
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {repair.images.map((image) => (
                  <a
                    key={image.id}
                    href={privateFileUrl(image.storageKey)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-line bg-soft"
                  >
                    {/* Authorisation is enforced by /api/files. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={privateFileUrl(image.storageKey)}
                      alt={image.originalName}
                      className="h-24 w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Clock3 className="h-4 w-4 text-brand" /> History
            </h2>
            <ol className="mt-3 space-y-3">
              {repair.statusHistory.map((entry, index) => (
                <li key={entry.id} className="flex gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      index === repair.statusHistory.length - 1 ? "bg-brand" : "bg-line"
                    }`}
                  />
                  <div>
                    <p className="text-[13px] font-medium text-ink">
                      {REPAIR_STATUS_LABELS[entry.status]}
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
            <p className="mt-2 font-medium text-ink">{repair.customerName}</p>
            <div className="mt-2 space-y-1.5 text-xs text-slate">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-brand" /> {repair.phone}
              </p>
              {repair.email ? (
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-brand" /> {repair.email}
                </p>
              ) : null}
              {repair.user ? (
                <Link
                  href={`/admin/customers/${repair.user.id}`}
                  className="inline-flex pt-1 font-semibold text-brand"
                >
                  View customer account
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-5 text-sm">
            <h2 className="font-semibold">Repair summary</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Reference</dt>
                <dd className="font-mono font-medium text-ink">{repair.reference}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Estimate</dt>
                <dd className="font-medium text-ink">
                  {repair.estimateAmount != null ? formatKES(repair.estimateAmount) : "Not set"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Technician</dt>
                <dd className="text-right font-medium text-ink">
                  {repair.assignedTechnician?.name || "Unassigned"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Last update</dt>
                <dd className="text-right font-medium text-ink">
                  {formatDateTime(repair.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>

          {repair.diagnoses.length > 0 ? (
            <div className="rounded-xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardCheck className="h-4 w-4 text-brand" /> Diagnosis history
              </h2>
              <ul className="mt-3 space-y-3">
                {repair.diagnoses.map((diagnosis) => (
                  <li key={diagnosis.id} className="rounded-lg border border-line p-3 text-xs">
                    <p className="whitespace-pre-line leading-5 text-slate">{diagnosis.findings}</p>
                    <p className="mt-1.5 text-[11px] text-slate">
                      {formatDateTime(diagnosis.createdAt)}
                      {diagnosis.technician?.name ? ` · ${diagnosis.technician.name}` : ""}
                      {diagnosis.estimateAmount != null
                        ? ` · ${formatKES(diagnosis.estimateAmount)}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
