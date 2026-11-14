import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Wrench,
  Printer,
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Clock,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { buttonVariants } from "@/components/ui/button-variants";
import { ProductCard } from "@/components/store/product-card";
import { ShopMap } from "@/components/layout/shop-map";

export const dynamic = "force-dynamic";

const divisions = [
  {
    title: "MIX Store",
    eyebrow: "Shop",
    description:
      "Smartphones, chargers, audio, power banks, cases and everyday accessories — selected for real life.",
    href: "/store",
    cta: "Browse the store",
    icon: ShoppingBag,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "MIX Care",
    eyebrow: "Repairs",
    description:
      "Tell us what is wrong with your phone, book it in online and follow the repair from diagnosis to collection.",
    href: "/repairs",
    cta: "Book a repair",
    icon: Wrench,
    image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "MIX Digital",
    eyebrow: "Digital services",
    description:
      "Printing, photocopying, scanning, typing, CV preparation and friendly help with online applications.",
    href: "/digital-services",
    cta: "See digital services",
    icon: Printer,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80",
  },
];

export default async function HomePage() {
  const [featured, settings, newArrivals] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        category: true,
        brand: true,
        variants: { where: { isActive: true } },
      },
    }),
    getSettings(),
    prisma.product.findMany({
      where: { isActive: true, isNewArrival: true },
      take: 3,
      orderBy: { createdAt: "desc" },
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        category: true,
        brand: true,
        variants: { where: { isActive: true } },
      },
    }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-white">
        <div className="container-page grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-soft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">
              <Sparkles className="h-3.5 w-3.5 text-brand" /> Electronics · Repairs · Digital services
            </span>
            <h1 className="mt-5 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.04em] text-ink sm:text-6xl">
              Technology
              <br />
              made <span className="text-brand">simpler.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[15.5px] leading-7 text-slate sm:text-base">
              From everyday electronics and accessories to reliable phone repairs and
              convenient digital services, MIX brings your technology needs together.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/services" className={buttonVariants({ size: "lg" })}>
                Explore services <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/store" className={buttonVariants({ variant: "outline", size: "lg" })}>
                <ShoppingBag className="h-4 w-4" /> Shop products
              </Link>
            </div>

            <dl className="mt-9 grid max-w-lg grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 sm:grid-cols-3">
              {[
                ["M-PESA", "Secure checkout"],
                ["Kehancha", "Shop collection"],
                ["MIX Care", "Repair tracking"],
              ].map(([title, detail]) => (
                <div key={title}>
                  <dt className="text-[13px] font-semibold text-ink">{title}</dt>
                  <dd className="mt-0.5 text-xs text-slate">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-soft">
              <Image
                src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=85"
                alt="Laptop and technology accessories on a desk"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-4 hidden w-[250px] rounded-xl border border-line bg-white p-4 shadow-lift sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                MIX Store
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">New arrivals in store</p>
              <p className="mt-0.5 text-xs leading-5 text-slate">
                {newArrivals.length > 0
                  ? newArrivals.map((item) => item.name).slice(0, 2).join(" · ")
                  : "Browse the latest accessories and electronics."}
              </p>
              <Link href="/store" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                Shop now <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="absolute right-4 top-4 rounded-lg border border-line bg-white/95 px-3 py-2 text-xs font-medium text-ink shadow-sm">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />
              M-PESA accepted
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-line bg-soft/40">
        <div className="container-page grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [ShieldCheck, "Secure M-PESA", "Pay safely from your phone"],
            [ShoppingBag, "Curated products", "Selected everyday technology"],
            [Wrench, "Repair updates", "Track progress in your account"],
            [MapPin, "Kehancha", "Collect your order in store"],
          ].map(([Icon, title, detail]) => (
            <div key={title} className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-white text-brand">
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-ink">{title}</p>
                <p className="mt-0.5 text-xs text-slate">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divisions */}
      <section className="section">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow">What we do</p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
                Three services. One place.
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-slate">
                Shop for technology, get your device repaired, or use our digital services.
                MIX keeps the whole experience connected.
              </p>
            </div>
            <Link href="/services" className={buttonVariants({ variant: "outline" })}>
              All services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {divisions.map((division) => (
              <Link
                key={division.title}
                href={division.href}
                className="group overflow-hidden rounded-2xl border border-line bg-white transition-all hover:border-brand/30 hover:shadow-lift"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-soft">
                  <Image
                    src={division.image}
                    alt={division.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-lg border border-white/30 bg-ink/80 text-white backdrop-blur-sm">
                    <division.icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brand">
                    {division.eyebrow}
                  </p>
                  <h3 className="mt-1.5 text-xl font-semibold">{division.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate">{division.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                    {division.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 ? (
        <section className="border-y border-line bg-soft/40 py-14 sm:py-18">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">From the store</p>
                <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Featured products</h2>
                <p className="mt-2 text-sm text-slate">
                  A selection of what is available at MIX right now.
                </p>
              </div>
              <Link href="/store" className={buttonVariants({ variant: "outline" })}>
                View all products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {featured.slice(0, 8).map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 2} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Repair + digital split */}
      <section className="section">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand">
              <Wrench className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-2xl font-semibold sm:text-3xl">A phone repair, without the guesswork.</h2>
            <p className="mt-3 text-sm leading-7 text-slate">
              Submit the problem online, get a unique repair reference and follow each step —
              from diagnosis and quotation to collection. No need to queue just to explain the issue.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-slate">
              {[
                "Describe the fault and upload photos of the device",
                "We diagnose and send an estimate for approval",
                "Track the repair status in your MIX account",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/repairs/book" className={buttonVariants()}>
                Book a repair
              </Link>
              <Link href="/account/repairs" className={buttonVariants({ variant: "outline" })}>
                Track a repair
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-ink p-6 text-white sm:p-8">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white">
              <Printer className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-2xl font-semibold text-white sm:text-3xl">Print, scan, type, get help online.</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Send your document and instructions ahead of time. We will confirm what is needed,
              quote where applicable and let you know when it is ready.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-white/80">
              {[
                "Printing, photocopying and scanning",
                "Document typing, formatting and CV preparation",
                "Help with online applications and forms",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" /> {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/digital-services" className={buttonVariants()}>
                Explore digital services
              </Link>
              <Link
                href="/digital-services#request"
                className={buttonVariants({ variant: "outline", className: "border-white/20 bg-transparent text-white hover:border-white/50 hover:bg-white/10 hover:text-white" })}
              >
                Send a request
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About strip */}
      <section className="border-t border-line bg-pale/50 py-14 sm:py-18">
        <div className="container-page grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">About MIX</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
              A practical technology partner in Kehancha, Migori County.
            </h2>
          </div>
          <div>
            <p className="text-[15px] leading-7 text-slate">
              MIX is built around a simple idea: technology should be easier to buy, easier to
              fix and easier to use. We bring products, repair care and everyday digital services
              together so you do not have to move between disconnected providers.
            </p>
            <p className="mt-4 text-[15px] leading-7 text-slate">
              Visit us in Kehancha, call, or start online. Our team will help you find the
              right product or the right next step.
            </p>
            <Link href="/about" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
              More about MIX <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section">
        <div className="container-page">
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6 sm:p-10">
                <p className="eyebrow">Visit or contact us</p>
                <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">We are within reach.</h2>
                <p className="mt-3 max-w-lg text-sm leading-7 text-slate">
                  Call or send a WhatsApp message, or visit the shop during business hours.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-start gap-3 rounded-xl border border-line p-4 transition-colors hover:border-brand/40">
                    <Phone className="mt-0.5 h-4 w-4 text-brand" />
                    <span>
                      <span className="block text-xs text-slate">Call MIX</span>
                      <span className="mt-0.5 block text-sm font-semibold text-ink">{settings.phone}</span>
                    </span>
                  </a>
                  <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-start gap-3 rounded-xl border border-line p-4 transition-colors hover:border-brand/40">
                    <MessageCircle className="mt-0.5 h-4 w-4 text-brand" />
                    <span>
                      <span className="block text-xs text-slate">WhatsApp</span>
                      <span className="mt-0.5 block text-sm font-semibold text-ink">Chat with us</span>
                    </span>
                  </a>
                  <div className="flex items-start gap-3 rounded-xl border border-line p-4">
                    <MapPin className="mt-0.5 h-4 w-4 text-brand" />
                    <span>
                      <span className="block text-xs text-slate">Location</span>
                      <span className="mt-0.5 block text-sm font-medium leading-5 text-ink">{settings.address}</span>
                    </span>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-line p-4">
                    <Clock className="mt-0.5 h-4 w-4 text-brand" />
                    <span>
                      <span className="block text-xs text-slate">Opening hours</span>
                      <span className="mt-0.5 block text-sm font-medium leading-5 text-ink">{settings.openingHours}</span>
                    </span>
                  </div>
                </div>
              </div>
              <ShopMap address={settings.address} className="h-full rounded-none border-0" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
