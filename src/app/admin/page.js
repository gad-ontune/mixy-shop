import Link from "next/link";
import {
  ShoppingCart,
  Wallet,
  Wrench,
  Inbox,
  Users,
  AlertTriangle,
  ArrowRight,
  Boxes,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasPermission } from "@/lib/authz";
import { formatKES, formatDateTime, formatNumber } from "@/lib/format";
import {
  PERMISSIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  REPAIR_STATUS_LABELS,
  REPAIR_STATUS_TONES,
} from "@/lib/constants";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { Badge } from "@/components/ui/badge";
import { TableWrapper, Th, Td } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage({ searchParams }) {
  const params = await searchParams;
  const user = await getSessionUser();
  const canViewSales = hasPermission(user, PERMISSIONS.REPORTS_VIEW) ||
    hasPermission(user, PERMISSIONS.ORDERS_MANAGE);
  const canViewInventory = hasPermission(user, PERMISSIONS.INVENTORY_MANAGE);
  const canViewRepairs = hasPermission(user, PERMISSIONS.REPAIRS_MANAGE);
  const canViewServices = hasPermission(user, PERMISSIONS.SERVICES_MANAGE);
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMERS_MANAGE);

  const [
    revenue,
    orderCount,
    pendingOrders,
    repairCount,
    requestCount,
    customerCount,
    recentOrders,
    lowStock,
    openRepairs,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "SUCCESS" },
      _sum: { total: true },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.repairRequest.count({
      where: { NOT: { status: { in: ["COMPLETED", "CANCELLED"] } } },
    }),
    prisma.serviceRequest.count({
      where: { NOT: { status: { in: ["COMPLETED", "CANCELLED"] } } },
    }),
    prisma.user.count({ where: { role: { name: "CUSTOMER" } } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { items: { select: { id: true } } },
    }),
    prisma.product.findMany({
      where: { isActive: true, stockQuantity: { lte: 5 } },
      orderBy: { stockQuantity: "asc" },
      take: 6,
      select: { id: true, name: true, sku: true, stockQuantity: true, lowStockAt: true },
    }),
    prisma.repairRequest.findMany({
      where: { NOT: { status: { in: ["COMPLETED", "CANCELLED"] } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    canViewSales && {
      label: "Paid revenue",
      value: formatKES(revenue._sum.total || 0),
      detail: `${formatNumber(orderCount)} orders total`,
      href: "/admin/reports",
      icon: Wallet,
    },
    {
      label: "Pending payments",
      value: String(pendingOrders),
      detail: "Awaiting M-PESA confirmation",
      href: "/admin/orders?status=PENDING_PAYMENT",
      icon: ShoppingCart,
    },
    canViewRepairs && {
      label: "Open repairs",
      value: String(repairCount),
      detail: "In the workshop or awaiting action",
      href: "/admin/repairs",
      icon: Wrench,
    },
    canViewServices && {
      label: "Open requests",
      value: String(requestCount),
      detail: "Digital service requests",
      href: "/admin/services/requests",
      icon: Inbox,
    },
    canViewCustomers && {
      label: "Customers",
      value: formatNumber(customerCount),
      detail: "Registered customer accounts",
      href: "/admin/customers",
      icon: Users,
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <AdminFlash searchParams={params} />
      <AdminHeader
        title={`Good to see you, ${(user?.name || "there").split(" ")[0]}.`}
        description="A quick look at what needs attention across the MIX business."
        actions={
          canViewSales ? (
            <Link href="/admin/reports" className={buttonVariants({ variant: "outline" })}>
              View reports <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-xl border border-line bg-white p-4 transition-colors hover:border-brand/40"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand">
                <stat.icon className="h-4 w-4" />
              </span>
              <ArrowRight className="h-4 w-4 text-slate transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
            </div>
            <p className="mt-3 text-xl font-semibold">{stat.value}</p>
            <p className="text-[13px] font-medium text-ink">{stat.label}</p>
            <p className="mt-0.5 text-xs text-slate">{stat.detail}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h2 className="text-sm font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-brand">
              View all
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <TableWrapper>
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-soft/40">
                    <Td>
                      <Link
                        href={`/admin/orders/${order.reference}`}
                        className="font-mono text-xs font-semibold text-brand"
                      >
                        {order.reference}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-slate">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </Td>
                    <Td>
                      <p className="text-[13px] font-medium">{order.customerName}</p>
                      <p className="text-[11px] text-slate">{order.phone}</p>
                    </Td>
                    <Td className="font-medium">{formatKES(order.total)}</Td>
                    <Td>
                      <Badge tone={ORDER_STATUS_TONES[order.status]}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-slate">No orders yet.</p>
          )}
        </div>

        <div className="space-y-5">
          {canViewInventory ? (
            <div className="rounded-xl border border-line bg-white">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Low stock
                </h2>
                <Link href="/admin/inventory" className="text-xs font-semibold text-brand">
                  Manage
                </Link>
              </div>
              {lowStock.length > 0 ? (
                <ul className="divide-y divide-line">
                  {lowStock.map((product) => (
                    <li key={product.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">{product.name}</p>
                        <p className="text-[11px] text-slate">SKU {product.sku}</p>
                      </div>
                      <Badge tone={product.stockQuantity <= 0 ? "red" : "amber"}>
                        {product.stockQuantity <= 0 ? "Out" : `${product.stockQuantity} left`}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2 px-5 py-8 text-sm text-slate">
                  <Boxes className="h-4 w-4 text-emerald-600" /> Stock levels look healthy.
                </p>
              )}
            </div>
          ) : null}

          {canViewRepairs ? (
            <div className="rounded-xl border border-line bg-white">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <h2 className="text-sm font-semibold">Active repairs</h2>
                <Link href="/admin/repairs" className="text-xs font-semibold text-brand">
                  View all
                </Link>
              </div>
              {openRepairs.length > 0 ? (
                <ul className="divide-y divide-line">
                  {openRepairs.map((repair) => (
                    <li key={repair.id} className="px-5 py-3">
                      <Link href={`/admin/repairs/${repair.reference}`} className="block">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[13px] font-medium text-ink">
                            {repair.deviceBrand} {repair.deviceModel}
                          </p>
                          <Badge tone={REPAIR_STATUS_TONES[repair.status]}>
                            {REPAIR_STATUS_LABELS[repair.status]}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate">
                          {repair.reference} · {repair.customerName}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-8 text-sm text-slate">No active repairs right now.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
