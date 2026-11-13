import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock3,
  ArrowRight,
  Package,
  MapPin,
  Truck,
  Store,
  ShieldCheck,
} from "lucide-react";
import { getOrderByReference, canViewOrder } from "@/lib/orders";
import { getSessionUser } from "@/lib/authz";
import { getSettings } from "@/lib/settings";
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
import { PaymentStatusPoller } from "@/components/checkout/payment-status-poller";
import { RetryPaymentForm } from "@/components/checkout/retry-payment-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order confirmation",
  description: "Your MIX Store order and M-PESA payment status.",
};

export default async function ConfirmationPage({ searchParams }) {
  const params = await searchParams;
  const reference = String(params?.ref || "").trim();
  const token = String(params?.token || "").trim();
  const simulated = params?.simulated === "1";

  if (!reference) notFound();

  const [order, user, settings] = await Promise.all([
    getOrderByReference(reference),
    getSessionUser(),
    getSettings(),
  ]);

  if (!order || !canViewOrder(order, user, token)) notFound();

  const latestPayment = order.payments[0] || null;
  const successfulPayment = order.payments.find((payment) => payment.status === "SUCCESS");
  const paid = order.paymentStatus === "SUCCESS";
  const failed = ["FAILED", "CANCELLED"].includes(order.paymentStatus);
  const pending = order.paymentStatus === "PENDING";

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div
            className={
              paid
                ? "border-b border-emerald-100 bg-emerald-50/70 px-6 py-7"
                : failed
                  ? "border-b border-red-100 bg-red-50/70 px-6 py-7"
                  : "border-b border-amber-100 bg-amber-50/70 px-6 py-7"
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span
                  className={
                    paid
                      ? "grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"
                      : failed
                        ? "grid h-12 w-12 shrink-0 place-items-center rounded-full bg-red-100 text-red-700"
                        : "grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700"
                  }
                >
                  {paid ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : failed ? (
                    <XCircle className="h-6 w-6" />
                  ) : (
                    <Clock3 className="h-6 w-6" />
                  )}
                </span>
                <div>
                  <h1 className="text-2xl font-semibold sm:text-3xl">
                    {paid
                      ? "Payment confirmed"
                      : failed
                        ? "Payment not completed"
                        : "Waiting for M-PESA payment"}
                  </h1>
                  <p className="mt-1.5 text-sm leading-6 text-slate">
                    {paid
                      ? "Thank you. We have received your payment and your order is confirmed."
                      : failed
                        ? "Your order was created but the M-PESA payment was not completed. You can try again below."
                        : "Check your phone and enter your M-PESA PIN to authorise the payment. This page updates automatically."}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate">Order reference</p>
                <p className="font-mono text-sm font-semibold tracking-wide text-ink">
                  {order.reference}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone={ORDER_STATUS_TONES[order.status]}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
              <Badge tone={PAYMENT_STATUS_TONES[order.paymentStatus]}>
                Payment: {PAYMENT_STATUS_LABELS[order.paymentStatus]}
              </Badge>
              {simulated ? <Badge tone="amber">Development simulation</Badge> : null}
            </div>

            {pending ? (
              <PaymentStatusPoller
                reference={order.reference}
                token={token || order.accessToken}
                initialPaymentStatus={order.paymentStatus}
              />
            ) : null}
          </div>

          <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <h2 className="text-base font-semibold">Your items</h2>
              <ul className="mt-3 divide-y divide-line">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                    <span>
                      <span className="block font-medium text-ink">{item.productName}</span>
                      <span className="block text-xs text-slate">
                        {item.variantName ? `${item.variantName} · ` : ""}Qty {item.quantity} ·{" "}
                        {formatKES(item.unitPrice)} each
                      </span>
                    </span>
                    <span className="shrink-0 font-medium">{formatKES(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>

              <dl className="mt-2 space-y-2 border-t border-line pt-3 text-sm">
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

              {order.history.length > 0 ? (
                <div className="mt-6 border-t border-line pt-5">
                  <h3 className="text-sm font-semibold">Order timeline</h3>
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
                          {entry.note ? (
                            <p className="text-xs leading-5 text-slate">{entry.note}</p>
                          ) : null}
                          <p className="text-[11px] text-slate/80">{formatDateTime(entry.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>

            <aside className="space-y-4">
              <div className="rounded-xl border border-line bg-soft/40 p-4 text-sm">
                <h3 className="font-semibold">Payment</h3>
                {paid ? (
                  <div className="mt-2 space-y-1 text-xs text-slate">
                    <p className="text-emerald-800">Paid {formatKES(order.total)}</p>
                    {successfulPayment?.mpesaReceipt ? (
                      <p>
                        M-PESA receipt:{" "}
                        <span className="font-mono font-semibold text-ink">
                          {successfulPayment.mpesaReceipt}
                        </span>
                      </p>
                    ) : null}
                    {successfulPayment?.completedAt ? (
                      <p>{formatDateTime(successfulPayment.completedAt)}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-2 space-y-1 text-xs text-slate">
                    <p>Amount due: <strong className="text-ink">{formatKES(order.total)}</strong></p>
                    {latestPayment?.failureReason ? <p>{latestPayment.failureReason}</p> : null}
                    <p>Phone: {order.phone}</p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-line p-4 text-sm">
                <h3 className="font-semibold">
                  {order.fulfilmentMethod === "DELIVERY" ? "Delivery" : "Collection"}
                </h3>
                <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate">
                  {order.fulfilmentMethod === "DELIVERY" ? (
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  ) : (
                    <Store className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  )}
                  <div>
                    <p className="font-medium text-ink">
                      {FULFILMENT_LABELS[order.fulfilmentMethod]}
                    </p>
                    <p className="mt-0.5">
                      {order.fulfilmentMethod === "DELIVERY"
                        ? order.deliveryAddress
                        : settings.address}
                    </p>
                    {order.deliveryNotes ? <p className="mt-1">{order.deliveryNotes}</p> : null}
                  </div>
                </div>
                {order.fulfilmentMethod === "COLLECTION" ? (
                  <p className="mt-2 flex items-start gap-2 text-xs text-slate">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    {settings.openingHours}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-line p-4 text-xs leading-5 text-slate">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <ShieldCheck className="h-4 w-4 text-brand" /> Important
                </p>
                <p className="mt-1.5">
                  Keep your order reference. We will only release items once payment is verified.
                  MIX never asks for your M-PESA PIN.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {order.userId ? (
                  <Link href="/account/orders" className={buttonVariants({ variant: "outline" })}>
                    <Package className="h-4 w-4" /> My orders
                  </Link>
                ) : null}
                <Link href="/store" className={buttonVariants({ variant: "outline" })}>
                  Continue shopping <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        </div>

        {failed ? (
          <div className="mt-5 rounded-2xl border border-line bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold">Try the payment again</h2>
            <p className="mt-1 text-sm leading-6 text-slate">
              We can send a new M-PESA prompt to your phone. If stock was released, we will try to
              reserve it again before asking for payment.
            </p>
            <RetryPaymentForm
              order={{ id: order.id, accessToken: order.accessToken, phone: order.phone }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
