import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { formatDate, formatKES } from "@/lib/format";
import { SERVICE_STATUS_LABELS, SERVICE_STATUS_TONES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export const metadata = { title: "My service requests" };

export default async function AccountRequestsPage() {
  const user = await requireUser("/account/requests");

  const requests = await prisma.serviceRequest.findMany({
    where: { userId: user.id },
    include: { service: true, _count: { select: { documents: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">MIX Digital</p>
          <h1 className="mt-1.5 text-2xl font-semibold sm:text-3xl">Service requests</h1>
          <p className="mt-1.5 text-sm text-slate">
            Follow your printing, design and digital service requests.
          </p>
        </div>
        <Link href="/digital-services#request" className={buttonVariants()}>
          Send a request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={FileText}
            title="No service requests yet"
            description="When you send a digital service request while signed in, it will appear here with its quote and progress."
            action={
              <Link href="/digital-services" className={buttonVariants()}>
                Browse digital services
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-xl border border-line bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{request.service.name}</p>
                    <Badge tone={SERVICE_STATUS_TONES[request.status]}>
                      {SERVICE_STATUS_LABELS[request.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate">{request.reference}</p>
                  <p className="mt-1 text-xs text-slate">
                    Submitted {formatDate(request.createdAt)}
                    {request._count.documents > 0
                      ? ` · ${request._count.documents} document${request._count.documents === 1 ? "" : "s"}`
                      : ""}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-slate">{request.instructions}</p>
                </div>
                <div className="text-right">
                  {request.quoteAmount != null ? (
                    <p className="text-sm font-semibold">{formatKES(request.quoteAmount)}</p>
                  ) : null}
                  <Link
                    href={`/account/requests/${request.reference}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand"
                  >
                    View request <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
