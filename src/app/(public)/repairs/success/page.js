import Link from "next/link";
import { CheckCircle2, Copy, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Repair Request Received" };

export default async function RepairSuccessPage({ searchParams }) {
  const params = await searchParams;
  const reference = params?.ref;
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        eyebrow="MIX Care"
        title="Repair request received."
        description="Your request has been logged. This is not yet a confirmed repair — we will diagnose the device and contact you with an estimate."
      />

      <section className="section">
        <div className="container-page max-w-2xl">
          <div className="rounded-2xl border border-line bg-white p-6 text-center sm:p-8">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">Keep your repair reference</h2>
            {reference ? (
              <div className="mx-auto mt-4 flex max-w-sm items-center justify-between rounded-xl border border-line bg-soft/60 px-4 py-3">
                <span className="font-mono text-sm font-semibold tracking-wide text-ink">{reference}</span>
                <Copy className="h-4 w-4 text-slate" aria-hidden="true" />
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate">Check your messages for the repair reference.</p>
            )}
            <p className="mt-4 text-sm leading-6 text-slate">
              We will use the phone number and email you provided to send repair updates. You can
              check progress at any time using the reference above and your phone number.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href={reference ? `/repairs/track?ref=${encodeURIComponent(reference)}` : "/repairs/track"} className={buttonVariants()}>
                Track this repair <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/account/repairs" className={buttonVariants({ variant: "outline" })}>
                Open my repairs
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-line bg-soft/40 p-5 text-sm leading-6 text-slate">
            <p className="font-semibold text-ink">Next step: bring the device in</p>
            <p className="mt-1">
              Visit {settings.address} during {settings.openingHours}. Bring the device and any
              accessories you mentioned. If you need directions, call {settings.phone} or message
              us on WhatsApp.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <Link href="/" className="text-sm font-medium text-brand hover:underline">
              Back to MIX home
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
