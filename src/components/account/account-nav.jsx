"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Wrench,
  FileText,
  UserRound,
  LogOut,
} from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { initials } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/account/repairs", label: "My repairs", icon: Wrench },
  { href: "/account/requests", label: "Service requests", icon: FileText },
  { href: "/account/profile", label: "Profile", icon: UserRound },
];

export function AccountNav({ user }) {
  const pathname = usePathname();

  return (
    <nav className="lg:sticky lg:top-32" aria-label="Account">
      <div className="rounded-xl border border-line bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand">
            {initials(user.name) || "MX"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-slate">{user.email || user.phone}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-white">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 border-b border-line px-4 py-3 text-sm font-medium transition-colors last:border-b-0",
                active ? "bg-brand-50 text-brand" : "text-ink hover:bg-soft",
              )}
            >
              <link.icon className="h-4 w-4" strokeWidth={1.8} />
              {link.label}
            </Link>
          );
        })}
      </div>

      <form action={signOutAction} className="mt-3">
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start text-slate")}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </form>

      {user.role === "ADMIN" || user.permissions?.length ? (
        <Link href="/admin" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-2 w-full justify-start text-brand")}>
          Open admin dashboard
        </Link>
      ) : null}
    </nav>
  );
}
