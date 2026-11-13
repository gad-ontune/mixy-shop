import { cn } from "@/lib/utils";

const tones = {
  blue: "bg-brand-50 text-brand-700 border-brand-100",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-800 border-amber-100",
  red: "bg-red-50 text-red-700 border-red-100",
  slate: "bg-soft text-slate border-line",
  dark: "bg-ink text-white border-ink",
};

export function Badge({ tone = "slate", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5",
        tones[tone] || tones.slate,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StockBadge({ stock, lowStockAt = 5 }) {
  if (stock <= 0) return <Badge tone="red">Out of stock</Badge>;
  if (stock <= lowStockAt) return <Badge tone="amber">Low stock · {stock} left</Badge>;
  return <Badge tone="green">In stock</Badge>;
}
