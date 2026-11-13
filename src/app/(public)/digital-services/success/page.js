import Link from "next/link";
import { CheckCircle2, ArrowRight, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Request Received" };

export default async function ServiceSuccessPage({ searchParams }) {
  const params = await searchParams;
  const reference = params?.ref;
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        eyebrow="MIX Digital"
        title="Request received."
        description="We have logged your digital service request. We will review the instructions and confirm any quote before beginning chargeable work."
      />

      <section className="section">
        <div className="container-page max-w-2xl">
          <div className="rounded-2xl border border-line bg-white p-6 text-center sm:p-8">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">Your request reference</h2>
            {reference ? (
              <div className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-2 rounded-xl border border-line bg-soft/60 px-4 py-3">
                <FileText className="h-4 w-4 text-slate" />
                <span className="font-mono text-sm font-semibold tracking-wide text-ink">{reference}</span>
              </div>
            ) : null}
            <p className="mt-4 text-sm leading-6 text-slate">
              Keep this reference for follow-up. If you were signed in, the request is also listed
              in your account.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/account/requests" className={buttonVariants()}>
                Open my requests <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/digital-services" className={buttonVariants({ variant: "outline" })}>
                Back to digital services
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-line bg-soft/40 p-5 text-sm leading-6 text-slate">
            <p className="font-semibold text-ink">What happens next</p>
            <p className="mt-1">
              We review your instructions and documents, then contact you if we need anything else
              or if a quote applies. When the work is ready, we will let you know. Collection is at{" "}
              {settings.address}, during {settings.openingHours}.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
