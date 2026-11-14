import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingBag, Wrench, Printer, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata = {
  title: "Services",
  description:
    "Explore MIX services: electronics shopping, phone repairs and digital services in Kehancha, Migori County.",
};

const divisions = [
  {
    name: "MIX Store",
    href: "/store",
    icon: ShoppingBag,
    description:
      "Shop electronics and accessories with secure M-PESA payment. Collect at our Kehancha shop, or ask us about delivery.",
    points: [
      "Smartphones, audio, chargers and power banks",
      "Cases, screen protectors and computer accessories",
      "Product options and live stock visibility",
      "Order history and status in your account",
    ],
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    cta: "Shop the store",
  },
  {
    name: "MIX Care",
    href: "/repairs",
    icon: Wrench,
    description:
      "Book a phone repair online, approve the estimate after diagnosis and follow the repair status from your account.",
    points: [
      "Screen, battery, charging and other repairs",
      "Online booking with device photos",
      "Unique repair reference for every request",
      "Status updates from diagnosis to collection",
    ],
    image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80",
    cta: "Explore MIX Care",
  },
  {
    name: "MIX Digital",
    href: "/digital-services",
    icon: Printer,
    description:
      "Get documents printed, copied, scanned or typed, and get friendly help with online applications and everyday digital tasks.",
    points: [
      "Printing, photocopying and scanning",
      "Document typing and formatting",
      "CV preparation",
      "Online application assistance",
    ],
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80",
    cta: "Explore MIX Digital",
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Everything MIX does, in one connected place."
        description="Choose a service to see how it works and what you need to get started."
      />

      <section className="section">
        <div className="container-page space-y-8">
          {divisions.map((division, index) => (
            <div
              key={division.name}
              className="grid overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-2"
            >
              <div className={`relative min-h-[240px] bg-soft ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                <Image
                  src={division.image}
                  alt={division.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6 sm:p-8 lg:p-10">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-brand">
                  <division.icon className="h-3.5 w-3.5" /> {division.name}
                </span>
                <p className="mt-4 text-[15px] leading-7 text-slate">{division.description}</p>
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {division.points.map((point) => (
                    <li key={point} className="flex gap-2 text-[13px] text-slate">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link href={division.href} className={`${buttonVariants()} mt-6`}>
                  {division.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-soft/40 py-14">
        <div className="container-page flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold">Not sure which service you need?</h2>
            <p className="mt-1.5 text-sm text-slate">
              Tell us what you are trying to do and we will point you in the right direction.
            </p>
          </div>
          <Link href="/contact" className={buttonVariants({ size: "lg" })}>
            Contact MIX <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
