import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", variant = "default", className }) {
  const store = variant === "store";
  return (
    <Link
      href={href}
      aria-label={store ? "MIX Store home" : "MIX home"}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-brand shadow-sm transition-colors group-hover:bg-brand-700">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M5 18V7.5L12 14l7-6.5V18" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block font-display text-[21px] font-bold tracking-[-0.03em] text-ink">
          MIX
          {store ? <span className="ml-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Store</span> : null}
        </span>
        {!store ? (
          <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.13em] text-slate">
            Technology made simpler
          </span>
        ) : null}
      </span>
    </Link>
  );
}
