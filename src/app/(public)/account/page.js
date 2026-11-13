import Link from "next/link";
import {
  Package,
  Wrench,
  FileText,
  ArrowRight,
  Bell,
  ShoppingBag,
  Clock3,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { formatKES, formatDate, relativeTime } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  REPAIR_STATUS_LABELS,
  REPAIR_STATUS_TONES,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_TONES,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { markNotificationsReadAction } from "@/actions/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Account overview" };

export default async function AccountOverviewPage() {
  const user = await requireUser("/account");

  const [orders, repairs, requests, notifications, openRepairs, openRequests, pendingOrders] =
    await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        include: { items: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.repairRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 2,
      }),
      prisma.serviceRequest.findMany({
        where: { userId: user.id },
        include: { service: true },
        orderBy: { createdAt: "desc" },
        take: 2,
      }),
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.repairRequest.count({
        where: { userId: user.id, NOT: { status: { in: ["COMPLETED", "CANCELLED"] } } },
      }),
      prisma.serviceRequest.count({
        where: { userId: user.id, NOT: { status: { in: ["COMPLETED", "CANCELLED"] } } },
      }),
      prisma.order.count({
        where: { userId: user.id, paymentStatus: "PENDING" },
      }),
    ]);

  const unread = notifications.filter((item) => !item.readAt);
  const firstName = (user.name || "there").split(" ")[0];

  const stats = [
    {
      label: "Orders",
      value: orders.length > 0 ? "View" : "0",
      detail: pendingOrders > 0 ? `${pendingOrders} awaiting payment` : "All up to date",
      href: "/account/orders",
      icon: Package,
    },
    {
      label: "Open repairs",
      value: String(openRepairs),
      detail: openRepairs > 0 ? "We are working on them" : "No active repairs",
      href: "/account/repairs",
      icon: Wrench,
    },
    {
      label: "Service requests",
      value: String(openRequests),
      detail: openRequests > 0 ? "In progress" : "Nothing pending",
      href: "/account/requests",
      icon: FileText,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-1.5 text-2xl font-semibold sm:text-3xl">Hello, {firstName}.</h1>
          <p className="mt-1.5 text-sm text-slate">
            Your orders, repairs and digital service requests in one place.
          </p>
        </div>
        <Link href="/store" className={buttonVariants({ variant: "outline" })}>
          <ShoppingBag className="h-4 w-4" /> Shop the store
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
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

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h2 className="text-sm font-semibold">Recent orders</h2>
            <Link href="/account/orders" className="text-xs font-semibold text-brand">
              View all
            </Link>
          </div>
          {orders.length > 0 ? (
            <ul className="divide-y divide-line">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.reference}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-soft/50"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-ink">{order.reference}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate">
                        {order.items.map((item) => item.productName).join(", ")}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">{formatKES(order.total)}</p>
                      <Badge tone={ORDER_STATUS_TONES[order.status]} className="mt-1">
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate">
              You have not placed an order yet.{" "}
              <Link href="/store" className="font-semibold text-brand">
                Start shopping
              </Link>
              .
            </p>
          )}
        </div>

        <div className="rounded-xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Bell className="h-4 w-4 text-brand" /> Notifications
            </h2>
            {unread.length > 0 ? (
              <form action={markNotificationsReadAction}>
                <button type="submit" className="text-xs font-semibold text-brand">
                  Mark read
                </button>
              </form>
            ) : null}
          </div>
          {notifications.length > 0 ? (
            <ul className="divide-y divide-line">
              {notifications.map((item) => (
                <li key={item.id} className="px-5 py-3.5">
                  <div className="flex items-start gap-2">
                    {!item.readAt ? (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    ) : (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-line" />
                    )}
                    <div>
                      <p className="text-[13px] font-medium leading-5 text-ink">{item.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate">{item.message}</p>
                      <p className="mt-0.5 text-[11px] text-slate/80">{relativeTime(item.createdAt)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate">
              Updates about your orders, repairs and requests will appear here.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold">Recent repairs</h2>
          {repairs.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {repairs.map((repair) => (
                <li key={repair.id}>
                  <Link href={`/account/repairs/${repair.reference}`} className="block">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-medium text-ink">
                        {repair.deviceBrand} {repair.deviceModel}
                      </p>
                      <Badge tone={REPAIR_STATUS_TONES[repair.status]}>
                        {REPAIR_STATUS_LABELS[repair.status]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate">
                      {repair.reference} · {formatDate(repair.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate">
              No repairs yet.{" "}
              <Link href="/repairs/book" className="font-semibold text-brand">
                Book a repair
              </Link>
              .
            </p>
          )}
        </div>

        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold">Recent service requests</h2>
          {requests.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {requests.map((request) => (
                <li key={request.id}>
                  <Link href={`/account/requests/${request.reference}`} className="block">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-medium text-ink">{request.service.name}</p>
                      <Badge tone={SERVICE_STATUS_TONES[request.status]}>
                        {SERVICE_STATUS_LABELS[request.status]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate">
                      {request.reference} · {formatDate(request.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate">
              No service requests yet.{" "}
              <Link href="/digital-services#request" className="font-semibold text-brand">
                Send a request
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-line bg-soft/40 p-4 text-xs leading-5 text-slate">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p>
          Need to update your contact details? Visit your{" "}
          <Link href="/account/profile" className="font-semibold text-brand">
            profile
          </Link>{" "}
          so we can reach you about orders and repairs.
        </p>
      </div>
    </div>
  );
}
