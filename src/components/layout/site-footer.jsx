import Link from "next/link";
import { Phone, Mail, MapPin, Clock, MessageCircle, ShieldCheck, Truck, Store } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { getSettings } from "@/lib/settings";

const shopLinks = [
  ["All products", "/store"],
  ["Smartphones", "/store/categories/smartphones"],
  ["Chargers & cables", "/store/categories/chargers"],
  ["Audio", "/store/categories/headphones"],
  ["Power banks", "/store/categories/power-banks"],
];

const serviceLinks = [
  ["Phone repairs", "/repairs"],
  ["Book a repair", "/repairs/book"],
  ["Digital services", "/digital-services"],
  ["Printing & copying", "/digital-services#services"],
  ["Contact MIX", "/contact"],
];

const accountLinks = [
  ["My account", "/account"],
  ["My orders", "/account/orders"],
  ["My repairs", "/account/repairs"],
  ["Service requests", "/account/requests"],
  ["Cart", "/cart"],
];

export async function SiteFooter() {
  const settings = await getSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-line bg-soft/50">
      <div className="container-page py-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-6 text-slate">
              Electronics, phone accessories, reliable phone repairs and convenient digital
              services — all under one roof in Nairobi.
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-slate">
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-center gap-2.5 hover:text-brand">
                <Phone className="h-4 w-4 text-brand" /> {settings.phone}
              </a>
              <a href={`mailto:${settings.email}`} className="flex items-center gap-2.5 hover:text-brand">
                <Mail className="h-4 w-4 text-brand" /> {settings.email}
              </a>
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {settings.address}
              </p>
              <p className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {settings.openingHours}
              </p>
            </div>
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-brand/40 hover:text-brand"
            >
              <MessageCircle className="h-4 w-4 text-brand" /> Chat on WhatsApp
            </a>
          </div>

          <FooterColumn title="Shop" links={shopLinks} />
          <FooterColumn title="Services" links={serviceLinks} />
          <FooterColumn title="Account" links={accountLinks} />
        </div>

        <div className="mt-10 grid gap-3 rounded-xl border border-line bg-white p-4 text-xs text-slate sm:grid-cols-3">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" /> Secure M-PESA checkout
          </span>
          <span className="flex items-center gap-2">
            <Store className="h-4 w-4 text-brand" /> Shop collection available
          </span>
          <span className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-brand" /> Delivery within {settings.deliveryCoverage?.split(",")[0] || "Nairobi"}
          </span>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 text-xs text-slate sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {settings.businessName}. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-brand">Privacy</Link>
            <Link href="/terms" className="hover:text-brand">Terms & returns</Link>
            <Link href="/contact" className="hover:text-brand">Support</Link>
            <Link href="/admin" className="hover:text-brand">Staff</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-slate transition-colors hover:text-brand">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
