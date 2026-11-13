import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ShoppingBag,
  Wrench,
  Printer,
  HeartHandshake,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getSettings } from "@/lib/settings";
import { buttonVariants } from "@/components/ui/button-variants";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "About MIX",
  description:
    "MIX is a Nairobi technology business bringing electronics, phone repairs and digital services together under one roof.",
};

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        eyebrow="About MIX"
        title="One business for the technology you use every day."
        description="MIX exists to make technology more straightforward — whether you are buying an accessory, fixing a phone or getting a document ready."
      />

      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="prose-mix max-w-2xl">
            <h2>Our approach</h2>
            <p>
              MIX is a technology and digital services business based in Nairobi, Kenya. We
              combine a retail store, a phone repair service and a digital services desk so that
              customers can get more done in one place.
            </p>
            <p>
              We believe a good technology experience is not only about the product. It is about
              clear information, honest recommendations, reliable follow-up and being able to ask
              a question when something is not clear.
            </p>
            <p>
              That is why the same MIX account lets you view your orders, follow a repair and check
              the status of a digital service request. You deal with one team.
            </p>

            <h2>What we offer</h2>
            <ul>
              <li>
                <strong>MIX Store</strong> — electronics, phone accessories and everyday technology
                products, with M-PESA checkout and shop collection.
              </li>
              <li>
                <strong>MIX Care</strong> — phone diagnostics, repair requests, quotations and
                progress tracking.
              </li>
              <li>
                <strong>MIX Digital</strong> — printing, photocopying, scanning, typing, CV
                preparation and online assistance.
              </li>
            </ul>

            <h2>What to expect</h2>
            <p>
              Product availability, prices and service charges are shown as clearly as possible.
              A repair request submitted online is not automatically accepted, and no repair work
              or charge begins until we have diagnosed the device and you have approved the
              estimate.
            </p>
            <p>
              Warranty and return terms depend on the specific product or service. If you are
              unsure, ask us before you buy or authorise a repair.
            </p>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="relative aspect-[4/3] bg-soft">
                <Image
                  src="https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80"
                  alt="Technology workspace"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [ShoppingBag, "Store", "Everyday electronics and accessories"],
                [Wrench, "Care", "Phone repair and progress updates"],
                [Printer, "Digital", "Printing and online assistance"],
                [HeartHandshake, "Support", "A real team to speak to"],
              ].map(([Icon, title, detail]) => (
                <div key={title} className="rounded-xl border border-line p-4">
                  <Icon className="h-4 w-4 text-brand" />
                  <p className="mt-2.5 text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate">{detail}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-line bg-soft/50 p-5">
              <h2 className="text-base font-semibold">Visit the shop</h2>
              <div className="mt-3 space-y-2.5 text-sm text-slate">
                <p className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {settings.address}
                </p>
                <p className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {settings.openingHours}
                </p>
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-center gap-2.5 hover:text-brand">
                  <Phone className="h-4 w-4 text-brand" /> {settings.phone}
                </a>
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 hover:text-brand">
                  <MessageCircle className="h-4 w-4 text-brand" /> WhatsApp MIX
                </a>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/contact" className={buttonVariants({ size: "sm" })}>
                  Contact us
                </Link>
                <Link href="/store" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Shop the store
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-soft/40 py-14">
        <div className="container-page grid gap-6 sm:grid-cols-3">
          {[
            [ShieldCheck, "Secure payments", "M-PESA payments are initiated and verified on our server."],
            [Users, "One customer account", "Orders, repairs and service requests in one place."],
            [CheckCircle2, "Clear next steps", "You know what happens after you submit a request."],
          ].map(([Icon, title, detail]) => (
            <div key={title} className="rounded-2xl border border-line bg-white p-5">
              <Icon className="h-5 w-5 text-brand" />
              <h2 className="mt-3 text-base font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-slate">{detail}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
