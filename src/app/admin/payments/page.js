import Link from "next/link";
import { CreditCard, Search, Wallet, RotateCcw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES } from "@/lib/constants";
import { formatKES, formatDateTime, formatNumber } from "@/lib/format";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { TableWrapper, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Payments" };

const PAGE_SIZE = 25;

export default async function AdminPaymentsPage({ searchParams }) {
  await requirePermission(PERMISSIONS.PAYMENTS_MANAGE, "/admin/payments");
  const params = await searchParams;

  const q = typeof params?.q === "string" ? params.q.trim() : "";
  const status = typeof params?.status === "string" ? params.status : "";
  const page = Math.max(1, Number.parseInt(params?.page, 10) || 1);

  const where = {
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { mpesaReceipt: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { order: { reference: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  };

  const [payments, total, successful, pending, failed] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { order: { select: { reference: true, customerName: true, total: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true }, _count: true }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (target) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (status) query.set("status", status);
    query.set("page", String(target));
    return `/admin/payments?${query.toString()}`;
  };

  return (
    <div className="space-y-5">
      <AdminFlash searchParams={params} />
      <AdminHeader
        title="Payments"
        description="M-PESA payment attempts, receipts and reconciliation."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-slate">
            <Wallet className="h-3.5 w-3.5 text-emerald-600" /> Received
          </p>
          <p className="mt-1.5 text-xl font-semibold">{formatKES(successful._sum.amount || 0)}</p>
          <p className="text-xs text-slate">{formatNumber(successful._count)} successful payments</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-slate">
            <RotateCcw className="h-3.5 w-3.5 text-amber-500" /> Pending
          </p>
          <p className="mt-1.5 text-xl font-semibold">{formatNumber(pending)}</p>
          <p className="text-xs text-slate">Awaiting M-PESA confirmation</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-slate">
            <CreditCard className="h-3.5 w-3.5 text-red-500" /> Failed
          </p>
          <p className="mt-1.5 text-xl font-semibold">{formatNumber(failed)}</p>
          <p className="text-xs text-slate">Customer can retry from the order</p>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-white p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search receipt, payment, order or phone"
            className="pl-9"
          />
        </div>
        <Select name="status" defaultValue={status} className="w-auto min-w-[150px]">
          <option value="">All statuses</option>
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
        {payments.length > 0 ? (
          <TableWrapper>
            <thead>
              <tr>
                <Th>Payment</Th>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Amount</Th>
                <Th>Receipt</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-soft/40">
                  <Td>
                    <p className="font-mono text-[11px] font-semibold text-ink">{payment.reference}</p>
                    <p className="text-[11px] text-slate">{formatDateTime(payment.createdAt)}</p>
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/orders/${payment.order.reference}`}
                      className="font-mono text-xs font-semibold text-brand"
                    >
                      {payment.order.reference}
                    </Link>
                  </Td>
                  <Td>
                    <p className="text-[13px] font-medium">{payment.order.customerName}</p>
                    <p className="text-[11px] text-slate">{payment.phone || "—"}</p>
                  </Td>
                  <Td className="font-medium">{formatKES(payment.amount)}</Td>
                  <Td className="font-mono text-[11px] text-slate">{payment.mpesaReceipt || "—"}</Td>
                  <Td>
                    <Badge tone={PAYMENT_STATUS_TONES[payment.status]}>
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={`/admin/orders/${payment.order.reference}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Open order
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        ) : (
          <div className="px-5 py-14 text-center">
            <CreditCard className="mx-auto h-6 w-6 text-slate" />
            <p className="mt-2 text-sm font-medium text-ink">No payments match those filters.</p>
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
