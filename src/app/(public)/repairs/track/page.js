import Link from "next/link";
import { Search, Wrench, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Field, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatKES } from "@/lib/format";
import { REPAIR_STATUS_LABELS, REPAIR_STATUS_TONES } from "@/lib/constants";
import { normalizeMsisdn } from "@/lib/payments/daraja";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Track a Repair",
  description: "Check the status of your MIX phone repair using your repair reference and phone number.",
};

export default async function TrackRepairPage({ searchParams }) {
  const params = await searchParams;
  const reference = String(params?.ref || "").trim().toUpperCase();
  const phone = String(params?.phone || "").trim();
  const settings = await getSettings();

  let repair = null;
  let searched = false;
  let mismatch = false;

  if (reference && phone) {
    searched = true;
    const candidate = await prisma.repairRequest.findUnique({
      where: { reference },
      include: {
        statusHistory: { orderBy: { createdAt: "asc" } },
        diagnoses: { orderBy: { createdAt: "desc" }, select: { findings: true, estimateAmount: true, createdAt: true } },
      },
    });

    if (candidate && candidate.phone === normalizeMsisdn(phone)) {
      repair = candidate;
    } else {
      mismatch = true;
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="MIX Care"
        title="Track a repair."
        description="Enter the repair reference we gave you and the phone number used for the request."
      />

      <section className="section">
        <div className="container-page grid max-w-5xl gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Search className="h-4 w-4 text-brand" /> Repair lookup
            </h2>
            <form method="get" action="/repairs/track" className="mt-4 space-y-4">
              <Field label="Repair reference" required htmlFor="ref">
                <Input id="ref" name="ref" defaultValue={reference} placeholder="MIX-REP-XXXXXXXX" required />
              </Field>
              <Field label="Phone number" required htmlFor="phone" hint="Use the number submitted with the repair.">
                <Input id="phone" name="phone" type="tel" defaultValue={phone} placeholder="0712 345 678" required />
              </Field>
              <button type="submit" className={`${buttonVariants()} w-full`}>
                Check status
              </button>
            </form>
            <p className="mt-4 text-xs leading-5 text-slate">
              Signed in? Your repair history is available in{" "}
              <Link href="/account/repairs" className="font-medium text-brand">your account</Link>.
            </p>
          </div>

          <div className="space-y-4">
            {mismatch ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
                We could not find a repair matching that reference and phone number. Check the
                details and try again, or contact MIX for help.
              </div>
            ) : null}

            {!searched ? (
              <div className="rounded-2xl border border-dashed border-line bg-soft/40 p-8 text-center">
                <Wrench className="mx-auto h-6 w-6 text-slate" />
                <p className="mt-3 text-sm font-semibold text-ink">Your repair status will appear here.</p>
                <p className="mt-1 text-sm leading-6 text-slate">
                  Use the reference from your repair confirmation. If you need a new repair, you
                  can book one online.
                </p>
                <Link href="/repairs/book" className={`${buttonVariants({ size: "sm" })} mt-4`}>
                  Book a repair <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}

            {repair ? (
              <div className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="border-b border-line bg-soft/40 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-sm font-semibold tracking-wide text-ink">{repair.reference}</p>
                    <Badge tone={REPAIR_STATUS_TONES[repair.status]}>
                      {REPAIR_STATUS_LABELS[repair.status]}
                    </Badge>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold">
                    {repair.deviceBrand} {repair.deviceModel}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate">
                    {repair.deviceType || "Device"} · Submitted {formatDate(repair.createdAt)}
                  </p>
                </div>

                <div className="space-y-5 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate">Reported problem</p>
                    <p className="mt-1.5 text-sm leading-6 text-ink">{repair.problemDescription}</p>
                  </div>

                  {repair.estimateAmount != null ? (
                    <div className="rounded-xl border border-line bg-brand-50/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand">Estimated repair cost</p>
                      <p className="mt-1 text-lg font-semibold text-ink">{formatKES(repair.estimateAmount)}</p>
                      <p className="mt-1 text-xs text-slate">
                        {["AWAITING_CUSTOMER_APPROVAL"].includes(repair.status)
                          ? "Waiting for your approval. Contact MIX to approve or decline."
                          : "Estimate recorded for this repair."}
                      </p>
                    </div>
                  ) : null}

                  {repair.diagnosis ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate">Diagnosis</p>
                      <p className="mt-1.5 text-sm leading-6 text-slate">{repair.diagnosis}</p>
                    </div>
                  ) : null}

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate">Progress updates</p>
                    <ol className="mt-3 space-y-3">
                      {repair.statusHistory.map((entry, index) => (
                        <li key={entry.id} className="flex gap-3">
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${index === repair.statusHistory.length - 1 ? "bg-brand" : "bg-line"}`} />
                          <div>
                            <p className="text-[13px] font-medium text-ink">{REPAIR_STATUS_LABELS[entry.status]}</p>
                            {entry.note ? <p className="mt-0.5 text-xs leading-5 text-slate">{entry.note}</p> : null}
                            <p className="mt-0.5 text-[11px] text-slate/80">{formatDate(entry.createdAt)}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {repair.status === "READY_FOR_COLLECTION" ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                      <p className="font-semibold">Ready for collection</p>
                      <p className="mt-1">
                        Collect at {settings.address} during {settings.openingHours}. Bring your repair
                        reference. Call {settings.phone} if you need directions.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
