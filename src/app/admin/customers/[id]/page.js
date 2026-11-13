import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, ShoppingCart, Wrench, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import {
  PERMISSIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  REPAIR_STATUS_LABELS,
  REPAIR_STATUS_TONES,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_TONES,
} from "@/lib/constants";
import { formatDate, formatDateTime, formatKES } from "@/lib/format";
import { AdminHeader } from "@/components/admin/admin-header";
import { Badge } from "@/components/ui/badge";
import { TableWrapper, Th, Td } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata = { title: "Customer details" };

export default async function AdminCustomerDetailPage({ params }) {
  await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE, "/admin/customers");
  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      customerProfile: true,
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { select: { id: true } } },
        take: 20,
      },
      repairRequests: { orderBy: { createdAt: "desc" }, take: 10 },
      serviceRequests: {
        orderBy: { createdAt: "desc" },
        include: { service: { select: { name: true } } },
        take: 10,
      },
    },
  });

  if (!customer) notFound();

  const paidOrders = customer.orders.filter((order) => order.paymentStatus === "SUCCESS");
  const spend = paidOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-5">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-brand"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All customers
      </Link>

      <AdminHeader
        title={customer.name}
        description={`Customer since ${formatDate(customer.createdAt)}`}
        actions={
          <Badge tone={customer.isActive ? "green" : "slate"}>
            {customer.isActive ? "Active" : "Disabled"}
          </Badge>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[0.6fr_1.4fr] xl:items-start">
        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-white p-5 text-sm">
            <h2 className="font-semibold">Contact</h2>
            <div className="mt-3 space-y-2 text-xs text-slate">
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-brand" /> {customer.email || "No email"}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-brand" /> {customer.phone || "No phone"}
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                <span>
                  {customer.customerProfile?.addressLine || "No address on file"}
                  {customer.customerProfile?.city ? `, ${customer.customerProfile.city}` : ""}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-sm font-semibold">At a glance</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-line p-3">
                <dt className="text-slate">Paid spend</dt>
                <dd className="mt-0.5 text-base font-semibold text-ink">{formatKES(spend)}</dd>
              </div>
              <div className="rounded-lg border border-line p-3">
                <dt className="text-slate">Orders</dt>
                <dd className="mt-0.5 text-base font-semibold text-ink">{customer.orders.length}</dd>
              </div>
              <div className="rounded-lg border border-line p-3">
                <dt className="text-slate">Repairs</dt>
                <dd className="mt-0.5 text-base font-semibold text-ink">
                  {customer.repairRequests.length}
                </dd>
              </div>
              <div className="rounded-lg border border-line p-3">
                <dt className="text-slate">Requests</dt>
                <dd className="mt-0.5 text-base font-semibold text-ink">
                  {customer.serviceRequests.length}
                </dd>
              </div>
            </dl>
          </div>

          {customer.customerProfile?.notes ? (
            <div className="rounded-xl border border-line bg-soft/40 p-5 text-xs leading-5 text-slate">
              <p className="font-semibold text-ink">Customer notes</p>
              <p className="mt-1.5 whitespace-pre-line">{customer.customerProfile.notes}</p>
            </div>
          ) : null}
        </aside>

        <div className="space-y-5">
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <h2 className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-sm font-semibold">
              <ShoppingCart className="h-4 w-4 text-brand" /> Orders
            </h2>
            {customer.orders.length > 0 ? (
              <TableWrapper>
                <thead>
                  <tr>
                    <Th>Order</Th>
                    <Th>Placed</Th>
                    <Th>Items</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-soft/40">
                      <Td>
                        <Link
                          href={`/admin/orders/${order.reference}`}
                          className="font-mono text-[11px] font-semibold text-brand"
                        >
                          {order.reference}
                        </Link>
                      </Td>
                      <Td className="text-xs text-slate">{formatDateTime(order.createdAt)}</Td>
                      <Td className="text-xs">{order.items.length}</Td>
                      <Td className="text-xs font-medium">{formatKES(order.total)}</Td>
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
              <p className="px-5 py-8 text-sm text-slate">No orders yet.</p>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-line bg-white">
              <h2 className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-sm font-semibold">
                <Wrench className="h-4 w-4 text-brand" /> Repairs
              </h2>
              {customer.repairRequests.length > 0 ? (
                <ul className="divide-y divide-line">
                  {customer.repairRequests.map((repair) => (
                    <li key={repair.id} className="px-5 py-3">
                      <Link href={`/admin/repairs/${repair.reference}`} className="block">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-medium text-ink">
                            {repair.deviceBrand} {repair.deviceModel}
                          </p>
                          <Badge tone={REPAIR_STATUS_TONES[repair.status]}>
                            {REPAIR_STATUS_LABELS[repair.status]}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate">
                          {repair.reference} · {formatDate(repair.createdAt)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-8 text-sm text-slate">No repairs yet.</p>
              )}
            </div>

            <div className="rounded-xl border border-line bg-white">
              <h2 className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-sm font-semibold">
                <FileText className="h-4 w-4 text-brand" /> Service requests
              </h2>
              {customer.serviceRequests.length > 0 ? (
                <ul className="divide-y divide-line">
                  {customer.serviceRequests.map((request) => (
                    <li key={request.id} className="px-5 py-3">
                      <Link href={`/admin/services/requests/${request.reference}`} className="block">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-medium text-ink">{request.service.name}</p>
                          <Badge tone={SERVICE_STATUS_TONES[request.status]}>
                            {SERVICE_STATUS_LABELS[request.status]}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate">
                          {request.reference} · {formatDate(request.createdAt)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-8 text-sm text-slate">No service requests yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
