import Link from "next/link";
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  Wrench,
  Printer,
  ShoppingBag,
  HelpCircle,
} from "lucide-react";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata = {
  title: "Contact",
  description:
    "Contact MIX in Nairobi for product questions, phone repairs and digital services.",
};

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to MIX."
        description="Ask about a product, a repair or a digital service. We are happy to help you work out the next step."
      />

      <section className="section">
        <div className="container-page grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-start gap-4 rounded-xl border border-line p-5 transition-colors hover:border-brand/40">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand">
                <Phone className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-xs font-medium uppercase tracking-wide text-slate">Call us</span>
                <span className="mt-1 block text-base font-semibold text-ink">{settings.phone}</span>
                <span className="mt-0.5 block text-xs text-slate">{settings.openingHours}</span>
              </span>
            </a>

            <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-start gap-4 rounded-xl border border-line p-5 transition-colors hover:border-brand/40">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand">
                <MessageCircle className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-xs font-medium uppercase tracking-wide text-slate">WhatsApp</span>
                <span className="mt-1 block text-base font-semibold text-ink">Chat with MIX</span>
                <span className="mt-0.5 block text-xs text-slate">Product questions, repairs and requests</span>
              </span>
            </a>

            <a href={`mailto:${settings.email}`} className="flex items-start gap-4 rounded-xl border border-line p-5 transition-colors hover:border-brand/40">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand">
                <Mail className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-xs font-medium uppercase tracking-wide text-slate">Email</span>
                <span className="mt-1 block text-base font-semibold text-ink">{settings.email}</span>
                <span className="mt-0.5 block text-xs text-slate">For documents and detailed enquiries</span>
              </span>
            </a>

            <div className="flex items-start gap-4 rounded-xl border border-line p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand">
                <MapPin className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-xs font-medium uppercase tracking-wide text-slate">Visit the shop</span>
                <span className="mt-1 block text-sm font-semibold leading-6 text-ink">{settings.address}</span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-slate">
                  <Clock className="h-3.5 w-3.5" /> {settings.openingHours}
                </span>
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-soft/40 p-6 sm:p-8">
            <h2 className="text-xl font-semibold">How can we help?</h2>
            <p className="mt-2 text-sm leading-7 text-slate">
              Choose the quickest route for what you need. If you already know the service, you can
              start online without waiting for a reply.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                [ShoppingBag, "Product question", "Check stock, options and prices in the store.", "/store"],
                [Wrench, "Phone repair", "Book a repair and describe the fault online.", "/repairs/book"],
                [Printer, "Digital service", "Send printing or document instructions.", "/digital-services#request"],
                [HelpCircle, "Order support", "View your orders and their current status.", "/account/orders"],
              ].map(([Icon, title, detail, href]) => (
                <Link key={title} href={href} className="group rounded-xl border border-line bg-white p-4 transition-colors hover:border-brand/40">
                  <Icon className="h-4 w-4 text-brand" />
                  <p className="mt-3 text-sm font-semibold text-ink group-hover:text-brand">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate">{detail}</p>
                </Link>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-line bg-white p-4">
              <p className="text-sm font-semibold text-ink">Before you visit</p>
              <p className="mt-1 text-xs leading-5 text-slate">
                For repairs, bring the device and any relevant accessories. For digital services,
                bring the document on a flash drive, email it in advance, or upload it with your
                online request. Charges are confirmed before work begins.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className={buttonVariants()}>
                <MessageCircle className="h-4 w-4" /> WhatsApp MIX
              </a>
              <Link href="/store" className={buttonVariants({ variant: "outline" })}>
                Visit the store <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-14">
        <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Where are you located?", "We are in the Nairobi CBD. Use the address above or message us on WhatsApp for directions."],
            ["Do you deliver?", "Delivery availability, coverage and charges are confirmed at checkout. You can also choose shop collection where offered."],
            ["Can I pay with M-PESA?", "Yes. Orders are paid through the M-PESA prompt sent to your phone. We never ask for your M-PESA PIN."],
            ["How do repairs work?", "Submit a request, we diagnose and quote, you approve, then we repair and let you know when it is ready for collection."],
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
