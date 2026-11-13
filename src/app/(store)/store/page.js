import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Store,
  Headphones,
  ChevronRight,
  Sparkles,
  Wrench,
  Printer,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getActivePromotion, getSettings } from "@/lib/settings";
import { buttonVariants } from "@/components/ui/button-variants";
import { ProductCard } from "@/components/store/product-card";
import { formatKES } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "MIX Store — Electronics & Accessories",
  description:
    "Shop smartphones, chargers, earphones, headphones, speakers, power banks, cases and computer accessories at MIX Store in Nairobi.",
};

const productInclude = {
  images: { take: 1, orderBy: { sortOrder: "asc" } },
  category: true,
  brand: true,
  variants: { where: { isActive: true } },
};

export default async function StorePage() {
  const [categories, bestSellers, newArrivals, settings, promotion, productCount] =
    await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: { where: { isActive: true } } } } },
      }),
      prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: productInclude,
      }),
      prisma.product.findMany({
        where: { isActive: true, isNewArrival: true },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: productInclude,
      }),
      getSettings(),
      getActivePromotion(),
      prisma.product.count({ where: { isActive: true } }),
    ]);

  const heroPromotion = promotion || {
    title: "Sound that moves with you",
    description:
      "Headphones, earbuds and speakers from brands you trust — available in store now.",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=85",
    ctaLabel: "Shop audio",
    ctaUrl: "/store/categories/headphones",
  };

  const featuredCategories = categories.slice(0, 8);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-soft/30">
        <div className="container-page grid items-stretch gap-4 py-6 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-ink">
            <Image
              src={heroPromotion.imageUrl}
              alt={heroPromotion.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 65vw"
              className="object-cover opacity-60"
            />
            <div className="relative flex min-h-[320px] flex-col justify-between p-6 text-white sm:min-h-[380px] sm:p-9">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                <Sparkles className="h-3.5 w-3.5" /> MIX Store
              </span>
              <div className="max-w-lg">
                <h1 className="text-3xl font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl">
                  {heroPromotion.title}
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/80 sm:text-[15px]">
                  {heroPromotion.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link href={heroPromotion.ctaUrl || "/store"} className={buttonVariants({ size: "lg" })}>
                    {heroPromotion.ctaLabel || "Shop now"} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/store/search"
                    className={buttonVariants({
                      variant: "outline",
                      size: "lg",
                      className: "border-white/25 bg-transparent text-white hover:border-white/60 hover:bg-white/10 hover:text-white",
                    })}
                  >
                    Browse all products
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex flex-col justify-between rounded-2xl border border-line bg-white p-5">
              <div>
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand">
                  <Truck className="h-4 w-4" />
                </span>
                <h2 className="mt-3 text-base font-semibold">Delivered or collected</h2>
                <p className="mt-1 text-[13px] leading-5 text-slate">
                  Choose shop collection or ask about delivery in {settings.deliveryCoverage?.split(",")[0] || "Nairobi"}.
                </p>
              </div>
              <p className="mt-3 text-xs text-slate">
                Delivery from {formatKES(settings.deliveryFee)} where available
              </p>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-line bg-white p-5">
              <div>
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <h2 className="mt-3 text-base font-semibold">Pay with M-PESA</h2>
                <p className="mt-1 text-[13px] leading-5 text-slate">
                  A payment prompt is sent to your phone. We never ask for your M-PESA PIN.
                </p>
              </div>
              <p className="mt-3 text-xs text-slate">{productCount} products available online</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-line bg-white">
        <div className="container-page grid grid-cols-2 gap-4 py-5 sm:grid-cols-4">
          {[
            [ShieldCheck, "Secure M-PESA", "Verified server-side"],
            [Store, "Shop collection", "Nairobi CBD"],
            [Truck, "Delivery options", settings.deliveryCoverage?.split(",")[0] || "Nairobi"],
            [Headphones, "Real support", "Talk to a person"],
          ].map(([Icon, title, detail]) => (
            <div key={title} className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 shrink-0 text-brand" />
              <div>
                <p className="text-[12.5px] font-semibold text-ink">{title}</p>
                <p className="text-[11px] text-slate">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="section scroll-mt-28">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Shop by category</p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Find what you need</h2>
            </div>
            <Link href="/store/search" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
              All categories <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {featuredCategories.map((category) => (
              <Link
                key={category.id}
                href={`/store/categories/${category.slug}`}
                className="group overflow-hidden rounded-xl border border-line bg-white transition-all hover:border-brand/30 hover:shadow-card"
              >
                <div className="relative aspect-[5/3] overflow-hidden bg-soft">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-2 px-3.5 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-ink group-hover:text-brand">{category.name}</p>
                    <p className="text-[11px] text-slate">{category._count.products} products</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="border-y border-line bg-soft/40 py-12 sm:py-14">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Popular right now</p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Best sellers</h2>
            </div>
            <Link href="/store/search?sort=popular" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {bestSellers.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        </div>
      </section>

      {/* Promo */}
      <section className="section">
        <div className="container-page">
          <div className="overflow-hidden rounded-2xl border border-line bg-pale/60">
            <div className="grid items-center gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="p-6 sm:p-9">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                  <Wrench className="h-3.5 w-3.5" /> MIX Care
                </span>
                <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
                  Something wrong with your phone?
                </h2>
                <p className="mt-2.5 max-w-lg text-sm leading-7 text-slate">
                  Book a repair online and track it from diagnosis to collection. You approve the
                  estimate before any repair work starts.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link href="/repairs/book" className={buttonVariants()}>
                    Book a repair
                  </Link>
                  <Link href="/repairs" className={buttonVariants({ variant: "outline" })}>
                    How repairs work
                  </Link>
                </div>
              </div>
              <div className="relative min-h-[220px] lg:min-h-[300px]">
                <Image
                  src="https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80"
                  alt="Phone repair"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      {newArrivals.length > 0 ? (
        <section className="border-y border-line bg-soft/40 py-12 sm:py-14">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Just in</p>
                <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">New arrivals</h2>
              </div>
              <Link href="/store/search?new=1" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                See what is new <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Digital services cross-sell */}
      <section className="section">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-line bg-ink p-6 text-white sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10">
                <Printer className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-white">Need printing or document help?</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-white/70">
                  Print, copy, scan, type or get help with an online application. Send the details
                  ahead of time and collect when ready.
                </p>
              </div>
            </div>
            <Link href="/digital-services" className={buttonVariants({ size: "lg", className: "shrink-0" })}>
              MIX Digital <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
