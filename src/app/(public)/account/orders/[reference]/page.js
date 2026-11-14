import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Store, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { formatKES, formatDateTime } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  FULFILMENT_LABELS,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order details" };

export default async function AccountOrderDetailPage({ params }) {
  const { reference } = await params;
  const user = await requireUser("/account/orders");

  const order = await prisma.order.findUnique({
    where: { reference },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      history: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order || order.userId !== user.id) notFound();

  const paid = order.paymentStatus === "SUCCESS";
  const canRetry = ["PENDING", "FAILED", "CANCELLED"].includes(order.paymentStatus) &&
    order.status !== "CANCELLED";

  return (
    <div>
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-brand">
        <ArrowLeft className="h-3.5 w-3.5" /> All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="mt-1.5 font-mono text-xl font-semibold tracking-wide sm:text-2xl">
            {order.reference}
          </h1>
          <p className="mt-1 text-xs text-slate">
            Placed {formatDateTime(order.createdAt)} · {FULFILMENT_LABELS[order.fulfilmentMethod]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={ORDER_STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
          <Badge tone={PAYMENT_STATUS_TONES[order.paymentStatus]}>
            Payment: {PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-white">
            <h2 className="border-b border-line px-5 py-3.5 text-sm font-semibold">Items</h2>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 px-5 py-3.5 text-sm">
                  <div>
                    <p className="font-medium text-ink">{item.productName}</p>
                    <p className="text-xs text-slate">
                      {item.variantName ? `${item.variantName} · ` : ""}SKU {item.sku}
                    </p>
                    <p className="mt-0.5 text-xs text-slate">
                      {formatKES(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium">{formatKES(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate">Subtotal</dt>
                <dd>{formatKES(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate">Delivery</dt>
                <dd>{order.deliveryFee > 0 ? formatKES(order.deliveryFee) : "Free"}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatKES(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-sm font-semibold">Order timeline</h2>
            <ol className="mt-3 space-y-3">
              {order.history.map((entry, index) => (
                <li key={entry.id} className="flex gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      index === order.history.length - 1 ? "bg-brand" : "bg-line"
                    }`}
                  />
                  <div>
                    <p className="text-[13px] font-medium text-ink">
                      {ORDER_STATUS_LABELS[entry.status]}
                    </p>
                    {entry.note ? <p className="text-xs leading-5 text-slate">{entry.note}</p> : null}
                    <p className="text-[11px] text-slate/80">{formatDateTime(entry.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-white p-5 text-sm">
            <h2 className="font-semibold">Payment</h2>
            {paid ? (
              <div className="mt-2 space-y-1 text-xs text-slate">
                <p className="font-medium text-emerald-700">Paid {formatKES(order.total)}</p>
                {order.payments.find((payment) => payment.status === "SUCCESS")?.mpesaReceipt ? (
                  <p>
                    Receipt:{" "}
                    <span className="font-mono font-semibold text-ink">
                      {order.payments.find((payment) => payment.status === "SUCCESS")?.mpesaReceipt}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <p className="text-xs leading-5 text-slate">
                  {order.payments[0]?.failureReason ||
                    "Payment has not been completed for this order."}
                </p>
                <p className="text-xs text-slate">
                  Amount due: <strong className="text-ink">{formatKES(order.total)}</strong>
                </p>
                {canRetry ? (
                  <Link
                    href={`/checkout/confirmation?ref=${encodeURIComponent(order.reference)}&token=${order.accessToken}`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    <RefreshCw className="h-4 w-4" /> Complete payment
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-line bg-white p-5 text-sm">
            <h2 className="font-semibold">
              {order.fulfilmentMethod === "DELIVERY" ? "Delivery" : "Collection"}
            </h2>
            <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate">
              {order.fulfilmentMethod === "DELIVERY" ? (
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              ) : (
                <Store className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              )}
              <div>
                <p className="font-medium text-ink">
                  {order.fulfilmentMethod === "DELIVERY"
                    ? order.deliveryAddress
                    : "Collect from the MIX shop"}
                </p>
                {order.fulfilmentMethod === "COLLECTION" ? (
                  <p className="mt-0.5">We will let you know when your order is ready for collection.</p>
                ) : null}
                {order.deliveryNotes ? <p className="mt-1">{order.deliveryNotes}</p> : null}
              </div>
            </div>
            {order.fulfilmentMethod === "COLLECTION" ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate">
                <Store className="h-3.5 w-3.5 text-brand" /> Bring your order reference.
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-line bg-soft/40 p-5 text-xs leading-5 text-slate">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <ShieldCheck className="h-4 w-4 text-brand" /> Need help?
            </p>
            <p className="mt-1.5">
              Contact MIX with your order reference if anything looks wrong. We will never ask for
              your M-PESA PIN.
            </p>
            <Link href="/contact" className="mt-2 inline-flex font-semibold text-brand">
              Contact support
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
