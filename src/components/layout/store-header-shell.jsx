"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Truck,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button-variants";
import { signOutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

const primaryLinks = [
  { href: "/store", label: "Shop" },
  { href: "/store/search?new=1", label: "New arrivals" },
  { href: "/contact", label: "Support" },
];

export function StoreHeaderShell({ user, cartCount, announcement, categories }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="bg-ink text-white">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-[11.5px]">
          <p className="flex items-center gap-1.5 truncate font-medium">
            <Truck className="h-3.5 w-3.5 shrink-0 text-brand-300" />
            <span className="truncate">{announcement}</span>
          </p>
          <Link href="/contact" className="hidden shrink-0 items-center gap-1.5 text-white/80 hover:text-white sm:flex">
            <HelpCircle className="h-3.5 w-3.5" /> Need help?
          </Link>
        </div>
      </div>

      <div className="border-b border-line">
        <div className="container-page flex h-16 items-center gap-4 lg:h-[72px]">
          <Logo href="/store" variant="store" />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Store">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                  pathname === link.href ? "bg-brand-50 text-brand" : "text-ink/80 hover:bg-soft",
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink/80 transition-colors hover:bg-soft"
            >
              MIX Home
            </Link>
          </nav>

          <form action="/store/search" method="get" className="ml-auto hidden max-w-md flex-1 md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
              <input
                type="search"
                name="q"
                placeholder="Search products, brands and categories"
                aria-label="Search products"
                className="h-10 w-full rounded-lg border border-line bg-soft/60 pl-9 pr-3 text-sm text-ink placeholder:text-slate/80 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link
              href="/store/search"
              className="grid h-9 w-9 place-items-center rounded-lg text-ink/75 hover:bg-soft md:hidden"
              aria-label="Search products"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </Link>
            <Link
              href={user ? "/account" : "/sign-in?callbackUrl=/store"}
              className="grid h-9 w-9 place-items-center rounded-lg text-ink/75 hover:bg-soft"
              aria-label={user ? "Your account" : "Sign in"}
            >
              <UserRound className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </Link>
            <Link
              href="/cart"
              className="relative grid h-9 w-9 place-items-center rounded-lg text-ink/75 hover:bg-soft"
              aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.8} />
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-ink hover:bg-soft lg:hidden"
              aria-label="Open store menu"
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      <div className="hidden border-b border-line bg-white lg:block">
        <div className="container-page flex h-11 items-center gap-1 overflow-x-auto no-scrollbar">
          <Link
            href="/store"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold text-brand hover:bg-brand-50"
          >
            <Sparkles className="h-3.5 w-3.5" /> Shop all
          </Link>
          <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
          {categories.slice(0, 9).map((category) => (
            <Link
              key={category.id}
              href={`/store/categories/${category.slug}`}
              className="shrink-0 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-slate transition-colors hover:bg-soft hover:text-ink"
            >
              {category.name}
            </Link>
          ))}
          <Link
            href="/store/search"
            className="ml-auto shrink-0 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold text-brand hover:bg-brand-50"
          >
            View all categories
          </Link>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/35"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-lift">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <Logo href="/store" variant="store" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-ink hover:bg-soft"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <form action="/store/search" method="get" className="relative mb-5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                <input
                  type="search"
                  name="q"
                  placeholder="Search the store"
                  aria-label="Search products"
                  className="h-11 w-full rounded-lg border border-line bg-soft/60 pl-9 pr-3 text-sm focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15"
                />
              </form>

              <div className="mb-5 rounded-xl border border-line bg-soft/60 p-4">
                {user ? (
                  <>
                    <p className="text-sm font-semibold text-ink">{user.name}</p>
                    <p className="text-xs text-slate">{user.email || user.phone}</p>
                    <div className="mt-3 flex gap-2">
                      <Link href="/account" className={cn(buttonVariants({ size: "sm" }), "flex-1")}>
                        My account
                      </Link>
                      <form action={signOutAction}>
                        <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                          Sign out
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-ink">Sign in to MIX</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate">
                      Track orders, save your details and check out faster.
                    </p>
                    <Link href="/sign-in?callbackUrl=/store" className={cn(buttonVariants({ size: "sm" }), "mt-3 w-full")}>
                      Sign in or create account
                    </Link>
                  </>
                )}
              </div>

              <nav className="space-y-1" aria-label="Store mobile">
                {primaryLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium hover:bg-soft">
                    {link.label}
                    <ChevronRight className="h-4 w-4 text-slate" />
                  </Link>
                ))}
                <Link href="/cart" className="flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium hover:bg-soft">
                  Cart {cartCount > 0 ? `(${cartCount})` : ""}
                  <ChevronRight className="h-4 w-4 text-slate" />
                </Link>
                <Link href="/" className="flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium hover:bg-soft">
                  MIX Home
                  <ChevronRight className="h-4 w-4 text-slate" />
                </Link>
              </nav>

              <p className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate">
                Shop by category
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/store/categories/${category.slug}`}
                    className="rounded-lg border border-line px-3 py-2.5 text-[13px] font-medium text-ink hover:border-brand/40 hover:text-brand"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-line p-4 text-sm">
                <p className="font-semibold text-ink">MIX Store</p>
                <p className="mt-1 text-xs leading-5 text-slate">
                  Secure M-PESA payments. Collect at our Nairobi CBD shop or ask about delivery.
                </p>
                <Link href="/contact" className="mt-2 inline-block text-xs font-semibold text-brand">
                  Contact support
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
