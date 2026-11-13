import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RepairForm } from "@/components/repairs/repair-form";
import { getSessionUser } from "@/lib/authz";
import { getSettings } from "@/lib/settings";

export const metadata = {
  title: "Book a Phone Repair",
  description: "Submit a phone repair request to MIX in Nairobi.",
};

const brands = [
  "Apple",
  "Samsung",
  "Tecno",
  "Infinix",
  "Huawei",
  "Xiaomi",
  "Oppo",
  "Vivo",
  "Nokia",
  "OnePlus",
  "Realme",
  "Google Pixel",
];

export default async function BookRepairPage() {
  const [user, settings] = await Promise.all([getSessionUser(), getSettings()]);

  return (
    <>
      <PageHeader
        eyebrow="MIX Care"
        title="Book a phone repair."
        description="Tell us about the device and the problem. We will diagnose it and send an estimate for your approval before any repair work begins."
      >
        <nav className="flex items-center gap-1.5 text-xs text-slate" aria-label="Breadcrumb">
          <Link href="/repairs" className="hover:text-brand">Repairs</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink">Book a repair</span>
        </nav>
      </PageHeader>

      <section className="section">
        <div className="container-page grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-7 lg:p-8">
            <h2 className="text-xl font-semibold">Repair request details</h2>
            <p className="mt-1.5 text-sm text-slate">
              Fields marked * are required. You can submit this request without creating an
              account, but signing in lets you track it in your dashboard.
            </p>
            <div className="mt-6">
              <RepairForm user={user} brands={brands} />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-line bg-soft/40 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-brand" /> What happens next
              </h3>
              <ol className="mt-3 space-y-3 text-[13px] leading-6 text-slate">
                <li><span className="font-semibold text-ink">1.</span> You receive a repair reference immediately.</li>
                <li><span className="font-semibold text-ink">2.</span> We review the request and plan the diagnosis.</li>
                <li><span className="font-semibold text-ink">3.</span> The device is inspected and an estimate is shared.</li>
                <li><span className="font-semibold text-ink">4.</span> You approve before repair work starts.</li>
                <li><span className="font-semibold text-ink">5.</span> We update the status until collection.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-line p-5">
              <h3 className="text-sm font-semibold">Visit or call</h3>
              <p className="mt-2 text-sm leading-6 text-slate">{settings.address}</p>
              <p className="mt-1 text-sm text-slate">{settings.openingHours}</p>
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="mt-2 block text-sm font-medium text-brand">
                {settings.phone}
              </a>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5">
              <h3 className="text-sm font-semibold">Already booked?</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate">
                Track the repair with your reference and phone number.
              </p>
              <Link href="/repairs/track" className="mt-3 inline-flex text-sm font-semibold text-brand">
                Track a repair
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
