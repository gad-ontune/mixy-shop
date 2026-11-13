"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingCart,
  CreditCard,
  Wrench,
  Sparkles,
  Inbox,
  Users,
  BarChart3,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package, permission: "products.manage" },
  { href: "/admin/categories", label: "Categories", icon: Layers, permission: "products.manage" },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, permission: "inventory.manage" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, permission: "orders.manage" },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, permission: "payments.manage" },
  { href: "/admin/repairs", label: "Repairs", icon: Wrench, permission: "repairs.manage" },
  { href: "/admin/services", label: "Digital services", icon: Sparkles, permission: "services.manage" },
  { href: "/admin/services/requests", label: "Service requests", icon: Inbox, permission: "services.manage" },
  { href: "/admin/customers", label: "Customers", icon: Users, permission: "customers.manage" },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, permission: "reports.view" },
  { href: "/admin/staff", label: "Staff", icon: ShieldCheck, permission: "staff.manage" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
];

function isActive(pathname, item) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminNav({ user, variant = "sidebar" }) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";
  const visible = items.filter(
    (item) => !item.permission || isAdmin || (user.permissions || []).includes(item.permission),
  );

  if (variant === "mobile") {
    return (
      <nav className="flex gap-1 overflow-x-auto py-2" aria-label="Admin">
        {visible.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium",
                active ? "bg-brand text-white" : "text-slate hover:bg-soft",
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1" aria-label="Admin">
      {visible.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
              active ? "bg-brand text-white" : "text-slate hover:bg-soft hover:text-ink",
            )}
          >
            <item.icon className="h-4 w-4" strokeWidth={1.9} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
