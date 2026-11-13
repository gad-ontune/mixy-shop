import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Store,
  Truck,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/authz";
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
import { Badge } from "@/components/ui/badge";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateOrderAction, reconcilePaymentAction } from "@/actions/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order details" };

export default async function AdminOrderDetailPage({ params, searchParams }) {
  const user = await requirePermission(PERMISSIONS.ORDERS_MANAGE, "/admin/orders");
  const { reference } = await params;
  const query = await searchParams;

  const order = await prisma.order.findUnique({
    where: { reference },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      history: { orderBy: { createdAt: "asc" }, include: { changedBy: { select: { name: true } } } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!order) notFound();

  const canReconcile = hasPermission(user, PERMISSIONS.PAYMENTS_MANAGE);
  const paid = order.paymentStatus === "SUCCESS";

  return (
    <div className="space-y-5">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-brand"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All orders
      </Link>
      <AdminFlash searchParams={query} />

      <AdminHeader
        title={order.reference}
        description={`Placed ${formatDateTime(order.createdAt)} · ${FULFILMENT_LABELS[order.fulfilmentMethod]}`}
        actions={
          <>
            <Badge tone={ORDER_STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
            <Badge tone={PAYMENT_STATUS_TONES[order.paymentStatus]}>
              Payment: {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </Badge>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr] xl:items-start">
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-white">
            <h2 className="border-b border-line px-5 py-3.5 text-sm font-semibold">Items ordered</h2>
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
            <h2 className="text-sm font-semibold">Update order</h2>
            <form action={updateOrderAction} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="reference" value={order.reference} />
              <Field label="Order status" htmlFor="status">
                <Select id="status" name="status" defaultValue={order.status}>
                  {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Note to customer"
                htmlFor="note"
                hint="Optional. Included in the order timeline and notification."
              >
                <Input id="note" name="note" placeholder="e.g. Ready at the shop" maxLength={1000} />
              </Field>
              <Field label="Internal notes" htmlFor="adminNotes" className="sm:col-span-2">
                <Textarea
                  id="adminNotes"
                  name="adminNotes"
                  rows={3}
                  defaultValue={order.adminNotes || ""}
                  maxLength={2000}
                  placeholder="Only visible to staff."
                />
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton pendingText="Updating…">Save order</SubmitButton>
              </div>
            </form>
            <p className="mt-2 text-[11px] leading-5 text-slate">
              Cancelling an order releases any reserved stock. The payment status is not changed by
              a status update.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-sm font-semibold">Timeline</h2>
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
                    <p className="text-[11px] text-slate/80">
                      {formatDateTime(entry.createdAt)}
                      {entry.changedBy?.name ? ` · ${entry.changedBy.name}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-white p-5 text-sm">
            <h2 className="font-semibold">Customer</h2>
            <p className="mt-2 font-medium text-ink">{order.customerName}</p>
            <div className="mt-2 space-y-1.5 text-xs text-slate">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-brand" /> {order.phone}
              </p>
              {order.email ? (
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-brand" /> {order.email}
                </p>
              ) : null}
              {order.user ? (
                <p className="pt-1">
                  <Link href={`/admin/customers/${order.user.id}`} className="font-semibold text-brand">
                    View customer account
                  </Link>
                </p>
              ) : (
                <p className="pt-1 text-[11px]">Guest checkout</p>
              )}
            </div>
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
                    : "Collect at the MIX shop"}
                </p>
                {order.deliveryNotes ? <p className="mt-1">{order.deliveryNotes}</p> : null}
              </div>
            </div>
            {order.fulfilmentMethod === "COLLECTION" ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate">
                <MapPin className="h-3.5 w-3.5 text-brand" /> Ask for the order reference at the counter.
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-line bg-white p-5 text-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4 text-brand" /> Payments
            </h2>
            {order.payments.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {order.payments.map((payment) => (
                  <li key={payment.id} className="rounded-lg border border-line p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-slate">{payment.reference}</span>
                      <Badge tone={PAYMENT_STATUS_TONES[payment.status]}>
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 font-medium text-ink">{formatKES(payment.amount)}</p>
                    <p className="text-slate">
                      {payment.phone || "—"} · {formatDateTime(payment.createdAt)}
                    </p>
                    {payment.mpesaReceipt ? (
                      <p className="mt-0.5 font-mono text-[11px] text-ink">
                        Receipt {payment.mpesaReceipt}
                      </p>
                    ) : null}
                    {payment.failureReason ? (
                      <p className="mt-0.5 text-red-700">{payment.failureReason}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate">No payment attempts recorded.</p>
            )}

            {!paid && canReconcile ? (
              <form action={reconcilePaymentAction} className="mt-4 space-y-2 border-t border-line pt-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Reconcile manually
                </p>
                <input
                  type="hidden"
                  name="paymentId"
                  value={order.payments[0]?.id || ""}
                />
                {!order.payments[0] ? (
                  <p className="text-[11px] text-red-700">
                    There is no payment record to reconcile. Ask the customer to retry payment.
                  </p>
                ) : null}
                <Field label="M-PESA receipt" htmlFor="receipt">
                  <Input id="receipt" name="receipt" placeholder="e.g. TGH4X9K2LM" required />
                </Field>
                <Field label="Reconciliation note" htmlFor="reconcile-note">
                  <Input id="reconcile-note" name="note" placeholder="Optional internal note" />
                </Field>
                <SubmitButton
                  variant="outline"
                  size="sm"
                  pendingText="Reconciling…"
                  disabled={!order.payments[0]}
                >
                  Mark payment as received
                </SubmitButton>
                <p className="text-[11px] leading-5 text-slate">
                  Only do this after confirming the receipt in your M-PESA statement. The order will
                  be marked paid and the customer notified.
                </p>
              </form>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
