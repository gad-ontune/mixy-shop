import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Camera,
  ClipboardCheck,
  Wrench,
  PackageCheck,
  Search,
  Phone,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { getSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/authz";

export const metadata = {
  title: "Phone Repairs",
  description:
    "Book a phone repair at MIX in Nairobi. Submit the fault online, approve the estimate and track the repair.",
};

const steps = [
  {
    icon: ClipboardCheck,
    title: "Send the details",
    text: "Tell us the device and the problem. Add a photo if it helps. You receive a unique repair reference.",
  },
  {
    icon: Search,
    title: "We diagnose",
    text: "Bring the device to the shop or arrange drop-off. A technician inspects it and records the findings.",
  },
  {
    icon: CheckCircle2,
    title: "You approve the estimate",
    text: "We share the estimated cost. No repair work begins until you approve it.",
  },
  {
    icon: Wrench,
    title: "Repair in progress",
    text: "We carry out the approved repair and update the status as work progresses.",
  },
  {
    icon: PackageCheck,
    title: "Ready for collection",
    text: "We let you know when the device is ready and what to bring when collecting.",
  },
];

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

export default async function RepairsPage() {
  const [settings, user] = await Promise.all([getSettings(), getSessionUser()]);

  return (
    <>
      <PageHeader
        eyebrow="MIX Care"
        title="Phone repairs, with a clear paper trail."
        description="Book the fault online and follow the repair from diagnosis to collection. A repair request is not automatically accepted — we diagnose first and you approve the estimate."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/repairs/book" className={buttonVariants({ size: "lg" })}>
            Book a repair <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/repairs/track" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Track a repair
          </Link>
        </div>
      </PageHeader>

      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Five clear steps.</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate">
              We keep the process simple and transparent. You will always know whether the repair
              has been received, diagnosed, approved, started or completed.
            </p>

            <ol className="mt-7 space-y-1">
              {steps.map((step, index) => (
                <li key={step.title} className="relative flex gap-4 pb-6">
                  {index < steps.length - 1 ? (
                    <span className="absolute left-[19px] top-10 h-[calc(100%-2.4rem)] w-px bg-line" aria-hidden="true" />
                  ) : null}
                  <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-white text-brand">
                    <step.icon className="h-4 w-4" />
                  </span>
                  <div className="pt-0.5">
                    <h3 className="text-[15px] font-semibold text-ink">
                      {index + 1}. {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="relative aspect-[4/3] bg-soft">
                <Image
                  src="https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80"
                  alt="Phone repair workbench"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-soft/40 p-5">
              <h2 className="text-base font-semibold">Common repairs</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  "Cracked screens",
                  "Battery replacement",
                  "Charging faults",
                  "Water damage assessment",
                  "Speaker and microphone faults",
                  "Software and setup help",
                ].map((item) => (
                  <p key={item} className="flex gap-2 text-[13px] text-slate">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" /> {item}
                  </p>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate">
                Repair availability and pricing depend on the device and the diagnosis. The
                estimate is confirmed before work begins.
              </p>
            </div>

            <div className="rounded-2xl border border-line p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <ShieldCheck className="h-4 w-4 text-brand" /> Before you book
              </h2>
              <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate">
                <li>Back up your data where possible. Repairs can affect stored data.</li>
                <li>Bring the device and any relevant accessories when dropping it off.</li>
                <li>Tell us about previous repairs or existing damage.</li>
                <li>
                  Devices with personal or confidential data are handled only by authorized staff.
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/repairs/book" className={buttonVariants({ size: "sm" })}>
                  Start a repair request
                </Link>
                {user ? (
                  <Link href="/account/repairs" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    My repairs
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-soft/40 py-14">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Device brands</p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Brands we commonly see</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate">
              If your brand is not listed, send us a message — we will tell you whether we can help
              before you bring the device in.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {brands.map((brand) => (
              <span key={brand} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink">
                {brand}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-white p-4">
            <p className="flex items-center gap-2 text-sm text-slate">
              <Clock className="h-4 w-4 text-brand" /> {settings.openingHours}
            </p>
            <span className="hidden h-4 w-px bg-line sm:block" />
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm font-medium text-ink hover:text-brand">
              <Phone className="h-4 w-4 text-brand" /> {settings.phone}
            </a>
            <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-ink hover:text-brand">
              <MessageCircle className="h-4 w-4 text-brand" /> WhatsApp us
            </a>
            <Link href="/repairs/book" className={`${buttonVariants({ size: "sm" })} ml-auto`}>
              Book online
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Can I send photos?", "Yes. You can upload up to four photos of the device when booking. This helps us understand visible damage."],
            ["Is the repair confirmed?", "No. The request is received first. We diagnose the device and you approve the estimate before repair work starts."],
            ["How do I follow progress?", "Use your repair reference on the tracking page, or open the repair in your MIX account if you were signed in."],
            ["Where do I collect?", "Collect at our Nairobi CBD shop once we mark the repair as ready. Bring your repair reference."],
          ].map(([question, answer]) => (
            <div key={question}>
              <h3 className="text-sm font-semibold text-ink">{question}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate">{answer}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
