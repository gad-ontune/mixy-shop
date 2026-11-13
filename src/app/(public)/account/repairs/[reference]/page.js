import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Wrench, Clock3, ClipboardCheck, ImageIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { formatDate, formatDateTime, formatKES } from "@/lib/format";
import { REPAIR_STATUS_LABELS, REPAIR_STATUS_TONES } from "@/lib/constants";
import { privateFileUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Repair details" };

export default async function AccountRepairDetailPage({ params }) {
  const { reference } = await params;
  const user = await requireUser("/account/repairs");

  const repair = await prisma.repairRequest.findUnique({
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
    },
  });

  if (!repair || repair.userId !== user.id) notFound();

  const active = !["COMPLETED", "CANCELLED"].includes(repair.status);
  const latestDiagnosis = repair.diagnoses[0] || null;

  return (
    <div>
      <Link
        href="/account/repairs"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-brand"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All repairs
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">MIX Care</p>
          <h1 className="mt-1.5 text-xl font-semibold sm:text-2xl">
            {repair.deviceBrand} {repair.deviceModel}
          </h1>
          <p className="mt-1 font-mono text-[11px] text-slate">{repair.reference}</p>
          <p className="mt-1 text-xs text-slate">
            {repair.deviceType || "Device"} · Submitted {formatDate(repair.createdAt)}
          </p>
        </div>
        <Badge tone={REPAIR_STATUS_TONES[repair.status]}>
          {REPAIR_STATUS_LABELS[repair.status]}
        </Badge>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Wrench className="h-4 w-4 text-brand" /> What you reported
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate">
              {repair.problemDescription}
            </p>
            {repair.additionalInfo ? (
              <p className="mt-3 whitespace-pre-line border-t border-line pt-3 text-sm leading-6 text-slate">
                {repair.additionalInfo}
              </p>
            ) : null}
            {repair.preferredDate ? (
              <p className="mt-3 text-xs text-slate">
                Preferred date: {formatDate(repair.preferredDate)}
              </p>
            ) : null}
          </div>

          {latestDiagnosis || repair.diagnosis || repair.estimateAmount != null ? (
            <div className="rounded-xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardCheck className="h-4 w-4 text-brand" /> Diagnosis and estimate
              </h2>
              {repair.diagnosis ? (
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate">
                  {repair.diagnosis}
                </p>
              ) : latestDiagnosis ? (
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate">
                  {latestDiagnosis.findings}
                </p>
              ) : null}
              {repair.estimateAmount != null ? (
                <p className="mt-3 text-sm text-slate">
                  Estimate:{" "}
                  <strong className="text-ink">{formatKES(repair.estimateAmount)}</strong>
                </p>
              ) : null}
              {latestDiagnosis?.technician?.name ? (
                <p className="mt-1 text-xs text-slate">
                  Assessed by {latestDiagnosis.technician.name} ·{" "}
                  {formatDateTime(latestDiagnosis.createdAt)}
                </p>
              ) : null}
            </div>
          ) : null}

          {repair.images.length > 0 ? (
            <div className="rounded-xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <ImageIcon className="h-4 w-4 text-brand" /> Photos you shared
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {repair.images.map((image) => (
                  <a
                    key={image.id}
                    href={privateFileUrl(image.storageKey)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block overflow-hidden rounded-lg border border-line bg-soft"
                  >
                    {/* Private files are served only to authorised users. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={privateFileUrl(image.storageKey)}
                      alt={image.originalName}
                      className="h-28 w-full object-cover transition-transform group-hover:scale-[1.02]"
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {repair.statusHistory.length > 0 ? (
            <div className="rounded-xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Clock3 className="h-4 w-4 text-brand" /> Repair timeline
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
                      {entry.note ? (
                        <p className="text-xs leading-5 text-slate">{entry.note}</p>
                      ) : null}
                      <p className="text-[11px] text-slate/80">
                        {formatDateTime(entry.createdAt)}
                        {entry.changedBy?.name ? ` · ${entry.changedBy.name}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-white p-5 text-sm">
            <h2 className="font-semibold">Repair details</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Reference</dt>
                <dd className="font-mono font-medium text-ink">{repair.reference}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Device</dt>
                <dd className="text-right font-medium text-ink">
                  {repair.deviceBrand} {repair.deviceModel}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Status</dt>
                <dd className="text-right font-medium text-ink">
                  {REPAIR_STATUS_LABELS[repair.status]}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Contact phone</dt>
                <dd className="text-right font-medium text-ink">{repair.phone}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Last update</dt>
                <dd className="text-right font-medium text-ink">
                  {formatDateTime(repair.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-line bg-soft/40 p-5 text-xs leading-5 text-slate">
            <p className="font-semibold text-ink">
              {active ? "What happens next?" : "Repair closed"}
            </p>
            <p className="mt-1.5">
              {active
                ? "Our technicians will keep your repair timeline updated here. If we need your approval for a repair estimate, we will contact you using the phone number on this request."
                : "This repair is no longer active. Contact MIX if you have a question about the work carried out or the device."}
            </p>
            <Link href="/contact" className="mt-2 inline-flex font-semibold text-brand">
              Contact support
            </Link>
          </div>

          <Link
            href="/repairs/book"
            className={`${buttonVariants({ variant: "outline" })} w-full`}
          >
            Book another repair
          </Link>
        </aside>
      </div>
    </div>
  );
}
