import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Clock3,
  Download,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { formatDateTime, formatKES } from "@/lib/format";
import { SERVICE_STATUS_LABELS, SERVICE_STATUS_TONES } from "@/lib/constants";
import { privateFileUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Service request details" };

function fileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AccountRequestDetailPage({ params }) {
  const { reference } = await params;
  const user = await requireUser("/account/requests");

  const request = await prisma.serviceRequest.findUnique({
    where: { reference },
    include: {
      service: true,
      documents: { orderBy: { createdAt: "asc" } },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { name: true } } },
      },
    },
  });

  if (!request || request.userId !== user.id) notFound();

  const active = !["COMPLETED", "CANCELLED"].includes(request.status);

  return (
    <div>
      <Link
        href="/account/requests"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-brand"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All service requests
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">MIX Digital</p>
          <h1 className="mt-1.5 text-xl font-semibold sm:text-2xl">{request.service.name}</h1>
          <p className="mt-1 font-mono text-[11px] text-slate">{request.reference}</p>
          <p className="mt-1 text-xs text-slate">
            Submitted {formatDateTime(request.createdAt)}
          </p>
        </div>
        <Badge tone={SERVICE_STATUS_TONES[request.status]}>
          {SERVICE_STATUS_LABELS[request.status]}
        </Badge>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ClipboardList className="h-4 w-4 text-brand" /> Your instructions
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate">
              {request.instructions}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 text-xs sm:grid-cols-3">
              {request.pages != null ? (
                <div>
                  <dt className="text-slate">Pages</dt>
                  <dd className="mt-0.5 font-medium text-ink">{request.pages}</dd>
                </div>
              ) : null}
              {request.copies != null ? (
                <div>
                  <dt className="text-slate">Copies</dt>
                  <dd className="mt-0.5 font-medium text-ink">{request.copies}</dd>
                </div>
              ) : null}
              {request.outputFormat ? (
                <div>
                  <dt className="text-slate">Output format</dt>
                  <dd className="mt-0.5 font-medium text-ink">{request.outputFormat}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {request.documents.length > 0 ? (
            <div className="rounded-xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-brand" /> Documents you shared
              </h2>
              <ul className="mt-3 divide-y divide-line">
                {request.documents.map((document) => (
                  <li key={document.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {document.originalName}
                      </p>
                      <p className="text-[11px] text-slate">{fileSize(document.size)}</p>
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

          {request.statusHistory.length > 0 ? (
            <div className="rounded-xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Clock3 className="h-4 w-4 text-brand" /> Request timeline
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
            <h2 className="font-semibold">Quote</h2>
            {request.quoteAmount != null ? (
              <div className="mt-2">
                <p className="text-2xl font-semibold text-ink">{formatKES(request.quoteAmount)}</p>
                <p className="mt-1 text-xs leading-5 text-slate">
                  {request.status === "QUOTED"
                    ? "Reply to our message or visit the shop to approve this quote."
                    : "This is the quoted amount for your request."}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs leading-5 text-slate">
                {request.service.priceFrom != null
                  ? `From ${formatKES(request.service.priceFrom)} per ${request.service.unit}. We will confirm the final price after reviewing your request.`
                  : "We will confirm the price after reviewing your request."}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-white p-5 text-sm">
            <h2 className="font-semibold">Request details</h2>
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
                <dt className="text-slate">Contact phone</dt>
                <dd className="text-right font-medium text-ink">{request.phone}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Last update</dt>
                <dd className="text-right font-medium text-ink">
                  {formatDateTime(request.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-line bg-soft/40 p-5 text-xs leading-5 text-slate">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <MessageSquare className="h-4 w-4 text-brand" />
              {active ? "Need to add something?" : "Request closed"}
            </p>
            <p className="mt-1.5">
              {active
                ? "If you need to send an updated document or change the instructions, contact MIX with your request reference."
                : "This request is closed. Contact MIX if you need another copy or have a question about the work."}
            </p>
            <Link href="/contact" className="mt-2 inline-flex font-semibold text-brand">
              Contact support
            </Link>
          </div>

          <Link
            href="/digital-services#request"
            className={`${buttonVariants({ variant: "outline" })} w-full`}
          >
            Send another request
          </Link>
        </aside>
      </div>
    </div>
  );
}
