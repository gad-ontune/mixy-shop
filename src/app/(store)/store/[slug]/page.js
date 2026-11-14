import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ShieldCheck,
  Store,
  Truck,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatKES } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { ProductGallery } from "@/components/store/product-gallery";
import { AddToCartForm } from "@/components/store/add-to-cart-form";
import { ProductCard } from "@/components/store/product-card";
import { Badge, StockBadge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const relatedInclude = {
  images: { take: 1, orderBy: { sortOrder: "asc" } },
  category: true,
  brand: true,
  variants: { where: { isActive: true } },
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true },
  });

  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images[0]?.url ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

function stockFor(product) {
  const active = (product.variants || []).filter((variant) => variant.isActive);
  if (active.length > 0) {
    return active.reduce((sum, variant) => sum + variant.stockQuantity, 0);
  }
  return product.stockQuantity;
}

export default async function ProductPage({ params }) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      brand: true,
      variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!product || !product.isActive) notFound();

  const [related, settings] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.categoryId,
        NOT: { id: product.id },
      },
      orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
      take: 4,
      include: relatedInclude,
    }),
    getSettings(),
  ]);

  const totalStock = stockFor(product);
  const specs =
    product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
      ? Object.entries(product.specs)
      : [];
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const priceRange =
    activeVariants.length > 0
      ? (() => {
          const prices = activeVariants.map((variant) => variant.price ?? product.price);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          return min === max ? formatKES(min) : `${formatKES(min)} – ${formatKES(max)}`;
        })()
      : formatKES(product.price);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    category: product.category?.name,
    image: product.images.map((image) => image.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: product.price,
      availability:
        totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/store/${product.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="border-b border-line bg-soft/40">
        <div className="container-page flex flex-wrap items-center gap-1.5 py-3.5 text-xs text-slate">
          <Link href="/store" className="hover:text-brand">Store</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/store/categories/${product.category.slug}`} className="hover:text-brand">
            {product.category.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="line-clamp-1 text-ink">{product.name}</span>
        </div>
      </div>

      <section className="container-page grid gap-8 py-8 lg:grid-cols-2 lg:gap-12 lg:py-10">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.brand ? (
              <Badge tone="slate">{product.brand.name}</Badge>
            ) : null}
            {product.isNewArrival ? <Badge tone="blue">New arrival</Badge> : null}
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <Badge tone="dark">
                Save {formatKES(product.compareAtPrice - product.price)}
              </Badge>
            ) : null}
          </div>

          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.02em] sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-3xl font-semibold text-ink">
              {activeVariants.length > 1 ? priceRange : formatKES(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <span className="text-base text-slate line-through">
                {formatKES(product.compareAtPrice)}
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate">
            <StockBadge stock={totalStock} lowStockAt={product.lowStockAt} />
            <span>SKU {product.sku}</span>
          </div>

          <p className="mt-4 text-[14.5px] leading-7 text-slate">{product.description}</p>

          <div className="mt-6 border-t border-line pt-6">
            <AddToCartForm product={product} />
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {[
              [ShieldCheck, "Secure M-PESA", "Verified on our server"],
              [Store, "Shop collection", "Kehancha"],
              [Truck, "Delivery", settings.deliveryEnabled ? `From ${formatKES(settings.deliveryFee)}` : "Ask in store"],
            ].map(([Icon, title, detail]) => (
              <div key={title} className="flex items-start gap-2.5 rounded-lg border border-line p-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  <p className="text-[12px] font-semibold text-ink">{title}</p>
                  <p className="text-[11px] text-slate">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="container-page grid gap-8 py-10 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <h2 className="text-lg font-semibold">Product details</h2>
            <p className="mt-3 text-sm leading-7 text-slate">{product.description}</p>

            {specs.length > 0 ? (
              <div className="mt-6 overflow-hidden rounded-xl border border-line">
                <table className="w-full text-left text-sm">
                  <tbody>
                    {specs.map(([key, value], index) => (
                      <tr key={key} className={index % 2 === 0 ? "bg-soft/40" : "bg-white"}>
                        <th scope="row" className="w-1/3 px-4 py-3 align-top font-medium text-ink">
                          {key}
                        </th>
                        <td className="px-4 py-3 text-slate">{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {activeVariants.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold">Available options</h3>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {activeVariants.map((variant) => (
                    <li key={variant.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[13px]">
                      <span className="text-ink">{variant.name}</span>
                      <span className="text-slate">
                        {variant.stockQuantity > 0 ? `${variant.stockQuantity} in stock` : "Out of stock"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-soft/40 p-4">
              <div className="flex items-center gap-3">
                <Wrench className="h-5 w-5 text-brand" />
                <div>
                  <p className="text-sm font-semibold">Need help choosing?</p>
                  <p className="text-xs text-slate">Talk to MIX before you buy.</p>
                </div>
              </div>
              <Link href="/contact" className="text-sm font-semibold text-brand">
                Contact us
              </Link>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-line p-5">
              <h3 className="text-sm font-semibold">What to expect</h3>
              <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate">
                {[
                  "Pay securely with M-PESA at checkout.",
                  "Collect at our Kehancha shop, or ask about delivery.",
                  "Keep your order reference for collection.",
                  "Ask us about warranty before buying.",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-5">
              <h3 className="text-sm font-semibold">MIX Care</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-slate">
                Something wrong with a device? Book a repair online and track it from diagnosis
                to collection.
              </p>
              <Link href="/repairs/book" className="mt-3 inline-flex text-sm font-semibold text-brand">
                Book a repair
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="border-t border-line bg-soft/40 py-10">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">More in {product.category.name}</p>
                <h2 className="mt-1.5 text-2xl font-semibold">You may also like</h2>
              </div>
              <Link
                href={`/store/categories/${product.category.slug}`}
                className="text-sm font-semibold text-brand"
              >
                View category
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
