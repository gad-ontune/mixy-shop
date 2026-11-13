import Link from "next/link";
import Image from "next/image";
import { formatKES } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product, className, priority = false }) {
  const image = product.images?.[0]?.url;
  const stock = product.variants?.length
    ? product.variants.filter((variant) => variant.isActive).reduce((sum, variant) => sum + variant.stockQuantity, 0)
    : product.stockQuantity;
  const hasVariants = (product.variants?.length || 0) > 0;

  return (
    <Link
      href={`/store/${product.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:shadow-lift",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-soft">
        {image ? (
          <Image
            src={image}
            alt={product.images[0]?.alt || product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate">No image</div>
        )}

        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <Badge tone="dark">Save {formatKES(product.compareAtPrice - product.price)}</Badge>
          ) : null}
          {product.isNewArrival ? <Badge tone="blue">New</Badge> : null}
        </div>

        {stock <= 0 ? (
          <div className="absolute inset-0 flex items-end bg-ink/5 p-3">
            <span className="rounded-md bg-white/95 px-2 py-1 text-[11px] font-semibold text-ink">
              Out of stock
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate">
          {product.brand?.name || product.category?.name}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[13.5px] font-medium leading-5 text-ink group-hover:text-brand sm:text-sm">
          {product.name}
        </h3>
        <div className="mt-auto pt-2.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[15px] font-semibold text-ink">{formatKES(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <span className="text-xs text-slate line-through">{formatKES(product.compareAtPrice)}</span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[11px] text-slate">
            {stock <= 0 ? "Out of stock" : hasVariants ? "Multiple options" : "In stock"}
          </p>
        </div>
      </div>
    </Link>
  );
}
