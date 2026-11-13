import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Package, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/constants";
import { formatKES, formatNumber } from "@/lib/format";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { TableWrapper, Th, Td } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button-variants";
import { SubmitButton } from "@/components/ui/submit-button";
import { toggleProductActiveAction } from "@/actions/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Products" };

const PAGE_SIZE = 20;

export default async function AdminProductsPage({ searchParams }) {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE, "/admin/products");
  const params = await searchParams;

  const q = typeof params?.q === "string" ? params.q.trim() : "";
  const categoryId = typeof params?.category === "string" ? params.category : "";
  const status = typeof params?.status === "string" ? params.status : "";
  const page = Math.max(1, Number.parseInt(params?.page, 10) || 1);

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "hidden" ? { isActive: false } : {}),
    ...(status === "low" ? { stockQuantity: { lte: 5 } } : {}),
  };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        _count: { select: { variants: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (target) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (categoryId) query.set("category", categoryId);
    if (status) query.set("status", status);
    query.set("page", String(target));
    return `/admin/products?${query.toString()}`;
  };

  return (
    <div className="space-y-5">
      <AdminFlash searchParams={params} />
      <AdminHeader
        title="Products"
        description={`${formatNumber(total)} product${total === 1 ? "" : "s"} in the catalogue.`}
        actions={
          <Link href="/admin/products/new" className={buttonVariants()}>
            <Plus className="h-4 w-4" /> Add product
          </Link>
        }
      />

      <form className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-white p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input name="q" defaultValue={q} placeholder="Search by name or SKU" className="pl-9" />
        </div>
        <Select name="category" defaultValue={categoryId} className="w-auto min-w-[160px]">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status} className="w-auto min-w-[140px]">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
          <option value="low">Low stock</option>
        </Select>
        <SubmitButton variant="outline" pendingText="Filtering…">
          Filter
        </SubmitButton>
      </form>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {products.length > 0 ? (
          <TableWrapper>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Stock</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-soft/40">
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-soft">
                        {product.images[0]?.url ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-slate" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="line-clamp-1 text-[13px] font-semibold text-ink hover:text-brand"
                        >
                          {product.name}
                        </Link>
                        <p className="text-[11px] text-slate">
                          {product.sku}
                          {product._count.variants > 0
                            ? ` · ${product._count.variants} variants`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-xs text-slate">{product.category.name}</Td>
                  <Td className="font-medium">{formatKES(product.price)}</Td>
                  <Td>
                    <Badge
                      tone={
                        product.stockQuantity <= 0
                          ? "red"
                          : product.stockQuantity <= product.lowStockAt
                            ? "amber"
                            : "green"
                      }
                    >
                      {product.stockQuantity}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={product.isActive ? "green" : "slate"}>
                      {product.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <form action={toggleProductActiveAction}>
                        <input type="hidden" name="productId" value={product.id} />
                        <SubmitButton variant="ghost" size="sm" pendingText="Saving…">
                          {product.isActive ? "Hide" : "Publish"}
                        </SubmitButton>
                      </form>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        ) : (
          <div className="px-5 py-14 text-center">
            <Package className="mx-auto h-6 w-6 text-slate" />
            <p className="mt-2 text-sm font-medium text-ink">No products match those filters.</p>
            <p className="mt-1 text-sm text-slate">Try clearing the search or add a new product.</p>
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
