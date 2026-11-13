import Link from "next/link";
import { Search, Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS, SERVICE_STATUS_LABELS, SERVICE_STATUS_TONES } from "@/lib/constants";
import { formatDate, formatKES } from "@/lib/format";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { TableWrapper, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Service requests" };

const PAGE_SIZE = 20;

export default async function AdminServiceRequestsPage({ searchParams }) {
  await requirePermission(PERMISSIONS.SERVICES_MANAGE, "/admin/services/requests");
  const params = await searchParams;

  const q = typeof params?.q === "string" ? params.q.trim() : "";
  const status = typeof params?.status === "string" ? params.status : "";
  const page = Math.max(1, Number.parseInt(params?.page, 10) || 1);

  const where = {
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { service: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  };

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      include: {
        service: { select: { name: true } },
        assignedTo: { select: { name: true } },
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (target) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (status) query.set("status", status);
    query.set("page", String(target));
    return `/admin/services/requests?${query.toString()}`;
  };

  return (
    <div className="space-y-5">
      <AdminFlash searchParams={params} />
      <AdminHeader
        title="Service requests"
        description={`${total} request${total === 1 ? "" : "s"} matching your filters.`}
        actions={
          <Link href="/admin/services" className={buttonVariants({ variant: "outline" })}>
            Manage services
          </Link>
        }
      />

      <form className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-white p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search reference, customer, phone or service"
            className="pl-9"
          />
        </div>
        <Select name="status" defaultValue={status} className="w-auto min-w-[190px]">
          <option value="">All request statuses</option>
          {Object.entries(SERVICE_STATUS_LABELS).map(([value, label]) => (
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
        {requests.length > 0 ? (
          <TableWrapper>
            <thead>
              <tr>
                <Th>Request</Th>
                <Th>Service</Th>
                <Th>Customer</Th>
                <Th>Quote</Th>
                <Th>Assigned</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-soft/40">
                  <Td>
                    <Link
                      href={`/admin/services/requests/${request.reference}`}
                      className="font-mono text-xs font-semibold text-brand"
                    >
                      {request.reference}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-slate">{formatDate(request.createdAt)}</p>
                  </Td>
                  <Td>
                    <p className="text-[13px] font-medium">{request.service.name}</p>
                    <p className="text-[11px] text-slate">
                      {request._count.documents} document{request._count.documents === 1 ? "" : "s"}
                    </p>
                  </Td>
                  <Td>
                    <p className="text-[13px]">{request.customerName}</p>
                    <p className="text-[11px] text-slate">{request.phone}</p>
                  </Td>
                  <Td className="text-xs">
                    {request.quoteAmount != null ? formatKES(request.quoteAmount) : "—"}
                  </Td>
                  <Td className="text-xs text-slate">{request.assignedTo?.name || "Unassigned"}</Td>
                  <Td>
                    <Badge tone={SERVICE_STATUS_TONES[request.status]}>
                      {SERVICE_STATUS_LABELS[request.status]}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={`/admin/services/requests/${request.reference}`}
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
            <Inbox className="mx-auto h-6 w-6 text-slate" />
            <p className="mt-2 text-sm font-medium text-ink">No requests match those filters.</p>
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
