import Link from "next/link";
import {
  Printer,
  ScanLine,
  FileText,
  Briefcase,
  Type,
  Globe,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Upload,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/authz";
import { getSettings } from "@/lib/settings";
import { formatKES } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { ServiceRequestForm } from "@/components/digital-services/service-request-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Digital Services",
  description:
    "Printing, photocopying, scanning, typing, CV preparation and online assistance at MIX in Nairobi.",
};

const icons = {
  printing: Printer,
  photocopying: Printer,
  scanning: ScanLine,
  "document-typing": Type,
  "cv-preparation": Briefcase,
  "document-formatting": FileText,
  "online-applications": Globe,
  "online-services": Globe,
};

export default async function DigitalServicesPage() {
  const [services, user, settings] = await Promise.all([
    prisma.digitalService.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    getSessionUser(),
    getSettings(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="MIX Digital"
        title="Documents and online tasks, handled."
        description="Printing, photocopying, scanning, typing and friendly help with online applications. Send your instructions and files ahead, or visit the shop."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="#request" className={buttonVariants({ size: "lg" })}>
            Send a request <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="#services" className={buttonVariants({ variant: "outline", size: "lg" })}>
            View services
          </Link>
        </div>
      </PageHeader>

      <section id="services" className="section scroll-mt-24">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Service catalogue</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">What would you like to get done?</h2>
            <p className="mt-3 text-[15px] leading-7 text-slate">
              Charges below are starting points. We confirm the final cost based on pages, copies,
              formatting and the work involved — before starting.
            </p>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = icons[service.slug] || FileText;
              return (
                <div key={service.id} className="flex flex-col rounded-xl border border-line bg-white p-5 transition-colors hover:border-brand/30">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-ink">{service.name}</h3>
                  <p className="mt-1.5 flex-1 text-[13px] leading-6 text-slate">{service.description}</p>
                  <p className="mt-3 border-t border-line pt-3 text-sm font-medium text-ink">
                    {service.priceFrom != null ? (
                      <>
                        From {formatKES(service.priceFrom)}
                        <span className="text-xs font-normal text-slate"> / {service.unit}</span>
                      </>
                    ) : (
                      "Ask for a quote"
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-soft/50 px-4 py-3 text-xs text-slate">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-brand" /> {settings.openingHours}</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-brand" /> Private document handling</span>
            <span className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5 text-brand" /> Upload files with your request</span>
          </div>
        </div>
      </section>

      <section id="request" className="scroll-mt-24 border-t border-line bg-soft/40 py-14 sm:py-18">
        <div className="container-page grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-7 lg:p-8">
            <h2 className="text-xl font-semibold">Send a service request</h2>
            <p className="mt-1.5 text-sm text-slate">
              We will review the instructions and confirm the price and completion time. You will
              receive a unique request reference.
            </p>
            <div className="mt-6">
              <ServiceRequestForm services={services} user={user} />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-line p-5">
              <h3 className="text-sm font-semibold">How it works</h3>
              <ol className="mt-3 space-y-3 text-[13px] leading-6 text-slate">
                <li><span className="font-semibold text-ink">1.</span> Send instructions and any documents.</li>
                <li><span className="font-semibold text-ink">2.</span> We review the request and confirm any quote.</li>
                <li><span className="font-semibold text-ink">3.</span> You approve and we process the work.</li>
                <li><span className="font-semibold text-ink">4.</span> We notify you when it is ready.</li>
                <li><span className="font-semibold text-ink">5.</span> Collect the output at the shop.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-brand" /> Document privacy
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-slate">
                Uploaded documents may contain personal information. Access is limited to
                authorized MIX staff, files are stored privately, and they are not published on
                the public website. Ask us about our document retention policy if you have
                concerns.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-brand-50/60 p-5">
              <h3 className="text-sm font-semibold">Need help choosing?</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-slate">
                Tell us what you have and what you need to end up with. We will recommend the right
                service.
              </p>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="font-medium text-brand">{settings.phone}</a>
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="font-medium text-brand">WhatsApp MIX</a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container-page grid gap-6 sm:grid-cols-3">
          {[
            ["Bring or upload", "Upload documents with your request, email them, or bring a flash drive to the shop."],
            ["Confirm the quote", "We confirm the final charge before beginning chargeable work."],
            ["Collect when ready", "We notify you when the request is ready. Bring your reference."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-line p-5">
              <CheckCircle2 className="h-5 w-5 text-brand" />
              <h3 className="mt-3 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
