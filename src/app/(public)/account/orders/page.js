import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";
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
import { EmptyState } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export const metadata = { title: "My orders" };

export default async function AccountOrdersPage() {
  const user = await requireUser("/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-1.5 text-2xl font-semibold sm:text-3xl">My orders</h1>
          <p className="mt-1.5 text-sm text-slate">
            View your order history, payment status and fulfilment details.
          </p>
        </div>
        <Link href="/store" className={buttonVariants({ variant: "outline" })}>
          Continue shopping
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="When you place an order at MIX Store, it will appear here with its payment and fulfilment status."
            action={
              <Link href="/store" className={buttonVariants()}>
                Browse the store
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-line bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-xs font-semibold text-ink">{order.reference}</p>
                    <Badge tone={ORDER_STATUS_TONES[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    <Badge tone={PAYMENT_STATUS_TONES[order.paymentStatus]}>
                      {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate">
                    Placed {formatDateTime(order.createdAt)} ·{" "}
                    {FULFILMENT_LABELS[order.fulfilmentMethod]}
                  </p>
                  <p className="mt-1.5 text-sm text-slate">
                    {order.items.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold">{formatKES(order.total)}</p>
                  <Link
                    href={`/account/orders/${order.reference}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand"
                  >
                    View order <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
