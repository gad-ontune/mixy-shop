"use client";

import { useState } from "react";
import { Minus, Plus, RefreshCw, Trash2 } from "lucide-react";
import { updateCartItemAction, removeCartItemAction } from "@/actions/cart";
import { SubmitButton } from "@/components/ui/submit-button";

export function CartQuantityForm({ item }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const max = Math.max(1, Math.min(item.stock || 1, 10));
  const changed = quantity !== item.quantity;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={updateCartItemAction} className="flex items-center gap-2">
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="quantity" value={quantity} />
        <div className="flex items-center rounded-lg border border-line bg-white">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            className="grid h-9 w-8 place-items-center text-slate hover:text-ink disabled:opacity-40"
            aria-label="Reduce quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(max, value + 1))}
            disabled={quantity >= max}
            className="grid h-9 w-8 place-items-center text-slate hover:text-ink disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <SubmitButton
          variant={changed ? "default" : "outline"}
          size="sm"
          pendingText="Updating…"
          className="h-9"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Update
        </SubmitButton>
      </form>

      <form action={removeCartItemAction}>
        <input type="hidden" name="itemId" value={item.id} />
        <SubmitButton
          variant="ghost"
          size="sm"
          className="text-slate hover:text-red-600"
          pendingText="Removing…"
        >
          <Trash2 className="h-4 w-4" /> Remove
        </SubmitButton>
      </form>
    </div>
  );
}
