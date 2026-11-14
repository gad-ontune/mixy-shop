"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingBag, AlertCircle } from "lucide-react";
import { addToCartAction } from "@/actions/cart";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatKES } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AddToCartForm({ product }) {
  const activeVariants = (product.variants || []).filter((variant) => variant.isActive);
  const hasVariants = activeVariants.length > 0;
  const [variantId, setVariantId] = useState(hasVariants ? activeVariants[0].id : "");
  const [quantity, setQuantity] = useState(1);
  const [state, formAction] = useActionState(addToCartAction, null);
  const router = useRouter();

  const selectedVariant = activeVariants.find((variant) => variant.id === variantId);
  const unitPrice = selectedVariant?.price ?? product.price;
  const stock = hasVariants ? selectedVariant?.stockQuantity ?? 0 : product.stockQuantity;
  const maxQuantity = Math.max(1, Math.min(10, stock));

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  useEffect(() => {
    setQuantity((current) => Math.min(current, maxQuantity));
  }, [maxQuantity]);

  return (
    <div className="space-y-5">
      {hasVariants ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Choose an option</p>
            <span className="text-xs text-slate">{activeVariants.length} available</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {activeVariants.map((variant) => {
              const disabled = variant.stockQuantity <= 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setVariantId(variant.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-left text-[13px] transition-colors",
                    variantId === variant.id
                      ? "border-brand bg-brand-50 ring-1 ring-brand"
                      : "border-line bg-white hover:border-brand/50",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span className="block font-medium text-ink">{variant.name}</span>
                  <span className="mt-0.5 block text-[11px] text-slate">
                    {disabled ? "Out of stock" : `${variant.stockQuantity} in stock`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line bg-soft/50 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate">Price</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{formatKES(unitPrice)}</p>
          <p className="mt-0.5 text-xs text-slate">
            {stock > 0 ? `${stock} available${selectedVariant ? ` · ${selectedVariant.name}` : ""}` : "Out of stock"}
          </p>
        </div>

        <div className="flex items-center rounded-lg border border-line bg-white">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            className="grid h-10 w-10 place-items-center text-slate hover:text-ink disabled:opacity-40"
            aria-label="Reduce quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-9 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
            disabled={quantity >= maxQuantity || stock <= 0}
            className="grid h-10 w-10 place-items-center text-slate hover:text-ink disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="productId" value={product.id} />
        {hasVariants ? <input type="hidden" name="variantId" value={variantId} /> : null}
        <input type="hidden" name="quantity" value={quantity} />

        <SubmitButton
          size="lg"
          className="w-full"
          disabled={stock <= 0}
          pendingText="Adding to cart…"
        >
          <ShoppingBag className="h-4 w-4" />
          {stock <= 0 ? "Out of stock" : "Add to cart"}
        </SubmitButton>
      </form>

      {state?.error ? (
        <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
        </p>
      ) : null}

      {state?.ok ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" /> {state.message}
          </span>
          <Link href="/cart" className="text-xs font-semibold underline underline-offset-2">
            View cart
          </Link>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate">
        <span>Secure M-PESA payment</span>
        <span>Collect at our Kehancha shop</span>
        <span>Ask us about delivery</span>
      </div>
    </div>
  );
}
