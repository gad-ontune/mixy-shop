import Link from "next/link";
import { Search, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/constants";
import { formatDate, formatKES, formatNumber } from "@/lib/format";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { TableWrapper, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Customers" };

const PAGE_SIZE = 25;

export default async function AdminCustomersPage({ searchParams }) {
  await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE, "/admin/customers");
  const params = await searchParams;
  const q = typeof params?.q === "string" ? params.q.trim() : "";
  const filter = typeof params?.filter === "string" ? params.filter : "";
  const page = Math.max(1, Number.parseInt(params?.page, 10) || 1);

  const where = {
    role: { name: "CUSTOMER" },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : {}),
    ...(filter === "inactive" ? { isActive: false } : {}),
    ...(filter === "active" ? { isActive: true } : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        _count: { select: { orders: true, repairRequests: true, serviceRequests: true } },
        orders: { where: { paymentStatus: "SUCCESS" }, select: { total: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (target) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (filter) query.set("filter", filter);
    query.set("page", String(target));
    return `/admin/customers?${query.toString()}`;
  };

  return (
    <div className="space-y-5">
      <AdminFlash searchParams={params} />
      <AdminHeader
        title="Customers"
        description={`${formatNumber(total)} customer account${total === 1 ? "" : "s"} matching your filters.`}
      />

      <form className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-white p-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input name="q" defaultValue={q} placeholder="Search name, email or phone" className="pl-9" />
        </div>
        <SubmitButton variant="outline" pendingText="Searching…">
          Search
        </SubmitButton>
        <Link
          href="/admin/customers?filter=inactive"
          className={buttonVariants({ variant: "outline", size: "md" })}
        >
          Inactive only
        </Link>
      </form>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {customers.length > 0 ? (
          <TableWrapper>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Contact</Th>
                <Th>Orders</Th>
                <Th>Paid spend</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const spend = customer.orders.reduce((sum, order) => sum + order.total, 0);
                return (
                  <tr key={customer.id} className="hover:bg-soft/40">
                    <Td>
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="text-[13px] font-semibold text-ink hover:text-brand"
                      >
                        {customer.name}
                      </Link>
                      <p className="text-[11px] text-slate">
                        {customer._count.repairRequests} repairs ·{" "}
                        {customer._count.serviceRequests} requests
                      </p>
                    </Td>
                    <Td>
                      <p className="text-xs">{customer.email || "—"}</p>
                      <p className="text-[11px] text-slate">{customer.phone || "—"}</p>
                    </Td>
                    <Td className="text-xs">{customer._count.orders}</Td>
                    <Td className="font-medium">{formatKES(spend)}</Td>
                    <Td className="text-xs text-slate">{formatDate(customer.createdAt)}</Td>
                    <Td>
                      <Badge tone={customer.isActive ? "green" : "slate"}>
                        {customer.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        View
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrapper>
        ) : (
          <div className="px-5 py-14 text-center">
            <Users className="mx-auto h-6 w-6 text-slate" />
            <p className="mt-2 text-sm font-medium text-ink">No customers match your search.</p>
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
