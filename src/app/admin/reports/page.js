import Link from "next/link";
import { BarChart3, TrendingUp, Wallet, ShoppingCart, Wrench, Inbox, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import {
  PERMISSIONS,
  ORDER_STATUS_LABELS,
  REPAIR_STATUS_LABELS,
  SERVICE_STATUS_LABELS,
} from "@/lib/constants";
import { formatKES, formatNumber, formatDate } from "@/lib/format";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reports" };

function isoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export default async function AdminReportsPage({ searchParams }) {
  await requirePermission(PERMISSIONS.REPORTS_VIEW, "/admin/reports");
  const params = await searchParams;

  const defaultTo = new Date();
  const defaultFrom = new Date(Date.now() - 29 * 86400000);
  const fromValue = typeof params?.from === "string" && params.from ? params.from : isoDate(defaultFrom);
  const toValue = typeof params?.to === "string" && params.to ? params.to : isoDate(defaultTo);

  const from = new Date(`${fromValue}T00:00:00+03:00`);
  const to = new Date(`${toValue}T23:59:59+03:00`);
  const validRange = !Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from <= to;

  const range = validRange ? { gte: from, lte: to } : { gte: defaultFrom, lte: defaultTo };

  const [orders, repairing, requests, topItems, newCustomers] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: range },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.repairRequest.groupBy({
      by: ["status"],
      where: { createdAt: range },
      _count: true,
    }),
    prisma.serviceRequest.groupBy({
      by: ["status"],
      where: { createdAt: range },
      _count: true,
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      where: { order: { createdAt: range, paymentStatus: "SUCCESS" } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 8,
    }),
    prisma.user.count({
      where: { createdAt: range, role: { name: "CUSTOMER" } },
    }),
  ]);

  const paidOrders = orders.filter((order) => order.paymentStatus === "SUCCESS");
  const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const deliveryRevenue = paidOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
  const averageOrder = paidOrders.length > 0 ? Math.round(revenue / paidOrders.length) : 0;

  const statusCounts = new Map();
  for (const order of orders) {
    statusCounts.set(order.status, (statusCounts.get(order.status) || 0) + 1);
  }

  const dailyMap = new Map();
  for (const order of paidOrders) {
    const key = isoDate(order.createdAt);
    dailyMap.set(key, (dailyMap.get(key) || 0) + order.total);
  }
  const daily = [...dailyMap.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const maxDaily = Math.max(1, ...daily.map((entry) => entry[1]));

  return (
    <div className="space-y-5">
      <AdminFlash searchParams={params} />
      <AdminHeader
        title="Reports"
        description="Sales, repairs and service performance for the selected period."
        actions={
          <Link
            href={`/admin/orders?from=${fromValue}&to=${toValue}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <Download className="h-4 w-4" /> View orders
          </Link>
        }
      />

      <form className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-white p-3">
        <Field label="From" htmlFor="from" className="w-auto">
          <Input id="from" name="from" type="date" defaultValue={fromValue} />
        </Field>
        <Field label="To" htmlFor="to" className="w-auto">
          <Input id="to" name="to" type="date" defaultValue={toValue} />
        </Field>
        <SubmitButton variant="outline" pendingText="Updating…">
          Apply range
        </SubmitButton>
        {!validRange ? (
          <p className="text-xs font-medium text-red-700">Choose a valid date range.</p>
        ) : null}
      </form>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Paid revenue", value: formatKES(revenue), detail: `${paidOrders.length} paid orders`, icon: Wallet },
          { label: "Average order", value: formatKES(averageOrder), detail: "Per paid order", icon: TrendingUp },
          { label: "Delivery collected", value: formatKES(deliveryRevenue), detail: "Within paid orders", icon: ShoppingCart },
          { label: "New customers", value: formatNumber(newCustomers), detail: "Accounts created", icon: BarChart3 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-white p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-slate">
              <stat.icon className="h-3.5 w-3.5 text-brand" /> {stat.label}
            </p>
            <p className="mt-1.5 text-xl font-semibold">{stat.value}</p>
            <p className="text-xs text-slate">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr] xl:items-start">
        <div className="rounded-xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Paid revenue by day</h2>
            <span className="text-[11px] text-slate">
              {formatDate(from)} – {formatDate(to)}
            </span>
          </div>
          {daily.length > 0 ? (
            <div className="mt-4 space-y-2">
              {daily.slice(-14).map(([day, amount]) => (
                <div key={day} className="flex items-center gap-3 text-xs">
                  <span className="w-24 shrink-0 text-slate">{formatDate(day)}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-soft">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.max(3, (amount / maxDaily) * 100)}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right font-medium text-ink">
                    {formatKES(amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-dashed border-line px-3 py-8 text-center text-sm text-slate">
              No paid orders in this period.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-line bg-white">
          <h2 className="border-b border-line px-5 py-3.5 text-sm font-semibold">Orders by status</h2>
          <ul className="divide-y divide-line">
            {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
              <li key={status} className="flex items-center justify-between px-5 py-2.5 text-xs">
                <span className="text-slate">{label}</span>
                <Badge tone={statusCounts.get(status) ? "blue" : "slate"}>
                  {formatNumber(statusCounts.get(status) || 0)}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr] xl:items-start">
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <h2 className="border-b border-line px-5 py-3.5 text-sm font-semibold">Top products by revenue</h2>
          {topItems.length > 0 ? (
            <ul className="divide-y divide-line">
              {topItems.map((item) => (
                <li key={item.productName} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">{item.productName}</p>
                    <p className="text-[11px] text-slate">
                      {formatNumber(item._sum.quantity || 0)} units sold
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold">{formatKES(item._sum.lineTotal || 0)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-sm text-slate">No paid product sales in this period.</p>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-white">
            <h2 className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-sm font-semibold">
              <Wrench className="h-4 w-4 text-brand" /> Repairs
            </h2>
            <ul className="divide-y divide-line">
              {repairing.length > 0 ? (
                repairing.map((entry) => (
                  <li key={entry.status} className="flex items-center justify-between px-5 py-2.5 text-xs">
                    <span className="text-slate">{REPAIR_STATUS_LABELS[entry.status]}</span>
                    <span className="font-semibold text-ink">{entry._count}</span>
                  </li>
                ))
              ) : (
                <li className="px-5 py-6 text-sm text-slate">No repairs in this period.</li>
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-line bg-white">
            <h2 className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-sm font-semibold">
              <Inbox className="h-4 w-4 text-brand" /> Service requests
            </h2>
            <ul className="divide-y divide-line">
              {requests.length > 0 ? (
                requests.map((entry) => (
                  <li key={entry.status} className="flex items-center justify-between px-5 py-2.5 text-xs">
                    <span className="text-slate">{SERVICE_STATUS_LABELS[entry.status]}</span>
                    <span className="font-semibold text-ink">{entry._count}</span>
                  </li>
                ))
              ) : (
                <li className="px-5 py-6 text-sm text-slate">No requests in this period.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
