import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import {
  PERMISSIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  FULFILMENT_LABELS,
} from "@/lib/constants";
import { formatKES, formatDateTime } from "@/lib/format";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { TableWrapper, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 20;

export default async function AdminOrdersPage({ searchParams }) {
  await requirePermission(PERMISSIONS.ORDERS_MANAGE, "/admin/orders");
  const params = await searchParams;

  const q = typeof params?.q === "string" ? params.q.trim() : "";
  const status = typeof params?.status === "string" ? params.status : "";
  const payment = typeof params?.payment === "string" ? params.payment : "";
  const page = Math.max(1, Number.parseInt(params?.page, 10) || 1);

  const where = {
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
    ...(payment ? { paymentStatus: payment } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: { select: { id: true } }, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (target) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (status) query.set("status", status);
    if (payment) query.set("payment", payment);
    query.set("page", String(target));
    return `/admin/orders?${query.toString()}`;
  };

  return (
    <div className="space-y-5">
      <AdminFlash searchParams={params} />
      <AdminHeader
        title="Orders"
        description={`${total} order${total === 1 ? "" : "s"} matching your filters.`}
      />

      <form className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-white p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search reference, name, phone or email"
            className="pl-9"
          />
        </div>
        <Select name="status" defaultValue={status} className="w-auto min-w-[170px]">
          <option value="">All order statuses</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select name="payment" defaultValue={payment} className="w-auto min-w-[150px]">
          <option value="">All payments</option>
          {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <SubmitButton variant="outline" pendingText="Filtering…">
          Filter
        </SubmitButton>
      </form>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {orders.length > 0 ? (
          <TableWrapper>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Fulfilment</Th>
                <Th>Total</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-soft/40">
                  <Td>
                    <Link
                      href={`/admin/orders/${order.reference}`}
                      className="font-mono text-xs font-semibold text-brand"
                    >
                      {order.reference}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-slate">{formatDateTime(order.createdAt)}</p>
                  </Td>
                  <Td>
                    <p className="text-[13px] font-medium">{order.customerName}</p>
                    <p className="text-[11px] text-slate">{order.phone}</p>
                  </Td>
                  <Td className="text-xs text-slate">
                    {FULFILMENT_LABELS[order.fulfilmentMethod]}
                    <p className="text-[11px]">{order.items.length} items</p>
                  </Td>
                  <Td className="font-medium">{formatKES(order.total)}</Td>
                  <Td>
                    <Badge tone={PAYMENT_STATUS_TONES[order.paymentStatus]}>
                      {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={ORDER_STATUS_TONES[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={`/admin/orders/${order.reference}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Open
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        ) : (
          <div className="px-5 py-14 text-center">
            <ShoppingCart className="mx-auto h-6 w-6 text-slate" />
            <p className="mt-2 text-sm font-medium text-ink">No orders match those filters.</p>
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-slate">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
