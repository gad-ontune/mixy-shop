import Link from "next/link";
import Image from "next/image";
import { ArrowRight, AlertTriangle, ShoppingBag, ShieldCheck, Store, Truck } from "lucide-react";
import { getCart, summarizeCart } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { formatKES } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CartQuantityForm } from "@/components/store/cart-quantity-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { clearCartAction } from "@/actions/cart";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your cart",
  description: "Review the items in your MIX Store cart before checkout.",
};

export default async function CartPage() {
  const [cart, settings] = await Promise.all([getCart(), getSettings()]);
  const summary = summarizeCart(cart);

  if (!cart || summary.items.length === 0) {
    return (
      <div className="container-page py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Browse the MIX Store and add products to your cart. Your cart is saved while you shop."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/store" className={buttonVariants()}>
                  Shop the store <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/repairs/book" className={buttonVariants({ variant: "outline" })}>
                  Book a repair
                </Link>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">MIX Store</p>
          <h1 className="mt-1.5 text-3xl font-semibold sm:text-4xl">Your cart</h1>
          <p className="mt-1.5 text-sm text-slate">
            {summary.itemCount} item{summary.itemCount === 1 ? "" : "s"} · {summary.items.length} product
            {summary.items.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/store" className={buttonVariants({ variant: "outline" })}>
          Continue shopping
        </Link>
      </div>

      {summary.hasIssues ? (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Some items have changed availability. Review the highlighted lines before checking out.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_0.55fr] lg:items-start">
        <div className="space-y-3">
          {summary.items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border bg-white p-4 ${item.issue ? "border-amber-300" : "border-line"}`}
            >
              <div className="flex gap-4">
                <Link
                  href={`/store/${item.product.slug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-soft sm:h-24 sm:w-24"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.product.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-[10px] text-slate">No image</span>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/store/${item.product.slug}`}
                        className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand sm:text-[15px]"
                      >
                        {item.product.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate">
                        {item.variant ? item.variant.name : item.product.category?.name}
                      </p>
                      {item.issue ? (
                        <p className="mt-1 text-xs font-medium text-amber-800">{item.issue}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink">{formatKES(item.lineTotal)}</p>
                      <p className="text-xs text-slate">{formatKES(item.unitPrice)} each</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <CartQuantityForm item={item} />
                    <Badge tone={item.stock <= 0 ? "red" : item.stock <= 5 ? "amber" : "green"}>
                      {item.stock <= 0 ? "Out of stock" : `${item.stock} available`}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <form action={clearCartAction}>
              <SubmitButton variant="ghost" size="sm" className="text-slate" pendingText="Clearing…">
                Clear cart
              </SubmitButton>
            </form>
            <Link href="/store" className="text-sm font-semibold text-brand">
              Add more products
            </Link>
          </div>
        </div>

        <aside className="sticky top-32 space-y-4">
          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-base font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate">Subtotal</dt>
                <dd className="font-medium">{formatKES(summary.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate">Delivery</dt>
                <dd className="text-slate">
                  {settings.deliveryEnabled
                    ? `From ${formatKES(settings.deliveryFee)}`
                    : "Not available"}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-semibold">Estimated total</dt>
                <dd className="font-semibold">{formatKES(summary.subtotal)}</dd>
              </div>
            </dl>
            <p className="mt-1.5 text-[11px] leading-5 text-slate">
              The final total is confirmed on the checkout page once you choose collection or
              delivery.
            </p>

            <Link
              href="/checkout"
              className={`${buttonVariants({ size: "lg" })} mt-4 w-full`}
              aria-disabled={summary.hasIssues}
            >
              Proceed to checkout <ArrowRight className="h-4 w-4" />
            </Link>
            {summary.hasIssues ? (
              <p className="mt-2 text-xs text-amber-800">
                Remove or reduce the highlighted items before checking out.
              </p>
            ) : null}

            <div className="mt-4 space-y-2 border-t border-line pt-4 text-xs text-slate">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand" /> Secure M-PESA payment
              </p>
              <p className="flex items-center gap-2">
                <Store className="h-4 w-4 text-brand" /> Collect at our Nairobi CBD shop
              </p>
              {settings.deliveryEnabled ? (
                <p className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-brand" /> Delivery within{" "}
                  {settings.deliveryCoverage?.split(",")[0] || "Nairobi"}
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
