import Link from "next/link";
import { Wrench, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { formatDate, formatKES } from "@/lib/format";
import { REPAIR_STATUS_LABELS, REPAIR_STATUS_TONES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export const metadata = { title: "My repairs" };

export default async function AccountRepairsPage() {
  const user = await requireUser("/account/repairs");

  const repairs = await prisma.repairRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">MIX Care</p>
          <h1 className="mt-1.5 text-2xl font-semibold sm:text-3xl">My repairs</h1>
          <p className="mt-1.5 text-sm text-slate">
            Follow your repair from request and diagnosis through to collection.
          </p>
        </div>
        <Link href="/repairs/book" className={buttonVariants()}>
          Book a repair
        </Link>
      </div>

      {repairs.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Wrench}
            title="No repair requests yet"
            description="When you book a repair while signed in, it will appear here so you can follow its progress."
            action={
              <Link href="/repairs/book" className={buttonVariants()}>
                Book a phone repair
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {repairs.map((repair) => (
            <div key={repair.id} className="rounded-xl border border-line bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">
                      {repair.deviceBrand} {repair.deviceModel}
                    </p>
                    <Badge tone={REPAIR_STATUS_TONES[repair.status]}>
                      {REPAIR_STATUS_LABELS[repair.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate">{repair.reference}</p>
                  <p className="mt-1 text-xs text-slate">
                    {repair.deviceType || "Device"} · Submitted {formatDate(repair.createdAt)}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-slate">
                    {repair.problemDescription}
                  </p>
                </div>
                <div className="text-right">
                  {repair.estimateAmount != null ? (
                    <p className="text-sm font-semibold">{formatKES(repair.estimateAmount)}</p>
                  ) : null}
                  <Link
                    href={`/account/repairs/${repair.reference}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand"
                  >
                    View repair <ChevronRight className="h-3.5 w-3.5" />
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
