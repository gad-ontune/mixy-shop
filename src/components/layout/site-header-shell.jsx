"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Search,
  ShoppingBag,
  UserRound,
  Phone,
  MessageCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button-variants";
import { signOutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/repairs", label: "Repairs" },
  { href: "/digital-services", label: "Digital Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeaderShell({ user, cartCount, phone, whatsapp, openingHours }) {
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

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="hidden border-b border-line bg-soft/80 md:block">
        <div className="container-page flex h-9 items-center justify-between text-[11px] font-medium text-slate">
          <p>Nairobi CBD · {openingHours}</p>
          <div className="flex items-center gap-5">
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-brand">
              <Phone className="h-3 w-3" /> {phone}
            </a>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-brand"
            >
              <MessageCircle className="h-3 w-3" /> WhatsApp us
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-line">
        <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[72px]">
          <Logo />

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-brand-50 text-brand"
                    : "text-ink/80 hover:bg-soft hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <Link
              href="/store/search"
              className="grid h-9 w-9 place-items-center rounded-lg text-ink/75 transition-colors hover:bg-soft hover:text-ink"
              aria-label="Search products"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </Link>
            <Link
              href={user ? "/account" : "/sign-in"}
              className="grid h-9 w-9 place-items-center rounded-lg text-ink/75 transition-colors hover:bg-soft hover:text-ink"
              aria-label={user ? "Your account" : "Sign in"}
            >
              <UserRound className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </Link>
            <Link
              href="/cart"
              className="relative hidden h-9 w-9 place-items-center rounded-lg text-ink/75 transition-colors hover:bg-soft hover:text-ink sm:grid"
              aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.8} />
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              ) : null}
            </Link>

            <Link href="/store" className={cn(buttonVariants({ size: "sm" }), "ml-1 hidden sm:inline-flex")}>
              Shop
            </Link>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="ml-0.5 grid h-9 w-9 place-items-center rounded-lg text-ink hover:bg-soft lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </div>
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
              <Logo />
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
                        <button
                          type="submit"
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-3")}
                          aria-label="Sign out"
                        >
                          <LogOut className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-ink">Welcome to MIX</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate">
                      Sign in to track orders, repairs and service requests.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Link href="/sign-in" className={cn(buttonVariants({ size: "sm" }), "flex-1")}>
                        Sign in
                      </Link>
                      <Link
                        href="/register"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}
                      >
                        Create account
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <nav className="space-y-1" aria-label="Mobile">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium",
                      isActive(link.href) ? "bg-brand-50 text-brand" : "text-ink hover:bg-soft",
                    )}
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 text-slate" />
                  </Link>
                ))}
              </nav>

              <div className="mt-5 grid gap-2">
                <Link href="/store" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
                  <ShoppingBag className="h-4 w-4" /> Shop at MIX Store
                </Link>
                <Link
                  href="/repairs/book"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
                >
                  Book a phone repair
                </Link>
              </div>

              <div className="mt-6 rounded-xl border border-line p-4 text-sm">
                <p className="font-semibold text-ink">Need help?</p>
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="mt-1 block text-slate hover:text-brand">
                  {phone}
                </a>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-brand"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
