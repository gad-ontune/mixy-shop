import Link from "next/link";
import { Boxes, Search, SlidersHorizontal, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { Input, Textarea, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { TableWrapper, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { adjustStockAction } from "@/actions/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Inventory" };

const PAGE_SIZE = 25;

export default async function AdminInventoryPage({ searchParams }) {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE, "/admin/inventory");
  const params = await searchParams;
  const q = typeof params?.q === "string" ? params.q.trim() : "";
  const filter = typeof params?.filter === "string" ? params.filter : "";
  const page = Math.max(1, Number.parseInt(params?.page, 10) || 1);

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
    ...(filter === "low" ? { stockQuantity: { lte: 5 } } : {}),
    ...(filter === "out" ? { stockQuantity: { lte: 0 } } : {}),
  };

  const [products, total, movements, stats] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        variants: { orderBy: { name: "asc" } },
        category: { select: { name: true } },
      },
      orderBy: [{ stockQuantity: "asc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        product: { select: { name: true, sku: true } },
        variant: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.product.aggregate({
      where: { isActive: true },
      _sum: { stockQuantity: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (target) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (filter) query.set("filter", filter);
    query.set("page", String(target));
    return `/admin/inventory?${query.toString()}`;
  };

  return (
    <div className="space-y-5">
      <AdminFlash searchParams={params} />
      <AdminHeader
        title="Inventory"
        description={`${total} product${total === 1 ? "" : "s"} shown · ${stats._sum.stockQuantity || 0} units on hand across active products.`}
      />

      <form className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-white p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input name="q" defaultValue={q} placeholder="Search by product, SKU or variant SKU" className="pl-9" />
        </div>
        <Select name="filter" defaultValue={filter} className="w-auto min-w-[150px]">
          <option value="">All stock</option>
          <option value="low">Low stock (≤5)</option>
          <option value="out">Out of stock</option>
        </Select>
        <SubmitButton variant="outline" pendingText="Filtering…">
          Filter
        </SubmitButton>
      </form>

      <div className="space-y-3">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="rounded-xl border border-line bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand">
                    <Boxes className="h-4 w-4" />
                  </span>
                  <div>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-[13px] font-semibold text-ink hover:text-brand"
                    >
                      {product.name}
                    </Link>
                    <p className="text-[11px] text-slate">
                      {product.sku} · {product.category.name}
                      {product.variants.length > 0
                        ? ` · ${product.variants.length} variants`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    tone={
                      product.stockQuantity <= 0
                        ? "red"
                        : product.stockQuantity <= product.lowStockAt
                          ? "amber"
                          : "green"
                    }
                  >
                    {product.stockQuantity} in stock
                  </Badge>
                  <Badge tone={product.isActive ? "slate" : "red"}>
                    {product.isActive ? "Active" : "Hidden"}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
                <div>
                  {product.variants.length > 0 ? (
                    <ul className="space-y-1.5">
                      {product.variants.map((variant) => (
                        <li
                          key={variant.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-1.5 text-xs"
                        >
                          <span className="text-ink">
                            {variant.name}{" "}
                            <span className="text-slate">· {variant.sku}</span>
                          </span>
                          <span
                            className={
                              variant.stockQuantity <= 0
                                ? "font-semibold text-red-600"
                                : "font-medium text-slate"
                            }
                          >
                            {variant.stockQuantity} units
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-lg border border-dashed border-line px-3 py-4 text-xs text-slate">
                      No variants. Adjust stock using the form on the right.
                    </p>
                  )}
                </div>

                <form action={adjustStockAction} className="rounded-lg border border-line bg-soft/40 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-brand" /> Adjust stock
                  </p>
                  <input type="hidden" name="productId" value={product.id} />
                  <div className="mt-2 space-y-2">
                    {product.variants.length > 0 ? (
                      <Select name="variantId" defaultValue="" required aria-label="Variant">
                        <option value="">Select variant</option>
                        {product.variants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.name} ({variant.stockQuantity})
                          </option>
                        ))}
                      </Select>
                    ) : null}
                    <Input
                      name="quantityChange"
                      type="number"
                      step="1"
                      placeholder="Change, e.g. 5 or -2"
                      required
                      aria-label="Quantity change"
                    />
                    <Textarea
                      name="reason"
                      rows={2}
                      placeholder="Reason, e.g. delivery received"
                      required
                      maxLength={300}
                      aria-label="Reason"
                    />
                    <SubmitButton size="sm" className="w-full" pendingText="Adjusting…">
                      Apply adjustment
                    </SubmitButton>
                  </div>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-line bg-white px-5 py-12 text-center">
            <Boxes className="mx-auto h-6 w-6 text-slate" />
            <p className="mt-2 text-sm font-medium text-ink">No products match that filter.</p>
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
              <Link href={pageHref(page - 1)} className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium">
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium">
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4 text-brand" /> Recent stock movements
          </h2>
        </div>
        {movements.length > 0 ? (
          <TableWrapper>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Product</Th>
                <Th>Change</Th>
                <Th>Reason</Th>
                <Th>By</Th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <Td className="whitespace-nowrap text-xs text-slate">
                    {formatDateTime(movement.createdAt)}
                  </Td>
                  <Td>
                    <p className="text-[13px] font-medium">{movement.product.name}</p>
                    <p className="text-[11px] text-slate">
                      {movement.variant?.name || movement.product.sku}
                    </p>
                  </Td>
                  <Td>
                    <Badge tone={movement.quantityChange >= 0 ? "green" : "red"}>
                      {movement.quantityChange >= 0 ? "+" : ""}
                      {movement.quantityChange}
                    </Badge>
                    <span className="ml-2 text-[11px] text-slate">
                      {movement.previousQuantity} → {movement.newQuantity}
                    </span>
                  </Td>
                  <Td className="max-w-[240px] text-xs text-slate">{movement.reason}</Td>
                  <Td className="text-xs text-slate">{movement.user?.name || "System"}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        ) : (
          <p className="px-5 py-8 text-sm text-slate">No stock movements recorded yet.</p>
        )}
      </div>
    </div>
  );
}
