import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2, Plus, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/constants";
import { formatKES, formatDateTime } from "@/lib/format";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { ProductForm } from "@/components/admin/product-form";
import { Field, Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import {
  saveVariantAction,
  deleteVariantAction,
  toggleProductActiveAction,
} from "@/actions/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }) {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE, "/admin/products");
  const { id } = await params;
  const query = await searchParams;

  const [product, categories, brands, movements] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.inventoryMovement.findMany({
      where: { productId: id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true } } },
    }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-brand"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All products
      </Link>
      <AdminFlash searchParams={query} />

      <AdminHeader
        title={product.name}
        description={`${product.sku} · ${formatKES(product.price)} · ${product.stockQuantity} in stock`}
        actions={
          <>
            <Badge tone={product.isActive ? "green" : "slate"}>
              {product.isActive ? "Active" : "Hidden"}
            </Badge>
            <form action={toggleProductActiveAction}>
              <input type="hidden" name="productId" value={product.id} />
              <SubmitButton variant="outline" size="sm" pendingText="Saving…">
                {product.isActive ? "Hide from store" : "Publish"}
              </SubmitButton>
            </form>
          </>
        }
      />

      <ProductForm
        product={product}
        categories={categories}
        brands={brands}
        cancelHref="/admin/products"
      />

      <div className="rounded-xl border border-line bg-white">
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold">Options and variants</h2>
          <p className="mt-0.5 text-xs text-slate">
            Products with variants keep their aggregate stock in sync automatically.
          </p>
        </div>

        {product.variants.length > 0 ? (
          <ul className="divide-y divide-line">
            {product.variants.map((variant) => (
              <li key={variant.id} className="px-5 py-4">
                <form action={saveVariantAction} className="grid gap-2 sm:grid-cols-[1.2fr_1fr_0.7fr_0.6fr_auto] sm:items-end">
                  <input type="hidden" name="variantId" value={variant.id} />
                  <input type="hidden" name="productId" value={product.id} />
                  <Field label="Variant name" htmlFor={`variant-name-${variant.id}`}>
                    <Input
                      id={`variant-name-${variant.id}`}
                      name="name"
                      defaultValue={variant.name}
                      required
                    />
                  </Field>
                  <Field label="SKU" htmlFor={`variant-sku-${variant.id}`}>
                    <Input
                      id={`variant-sku-${variant.id}`}
                      name="sku"
                      defaultValue={variant.sku}
                      required
                    />
                  </Field>
                  <Field label="Price (KES)" htmlFor={`variant-price-${variant.id}`}>
                    <Input
                      id={`variant-price-${variant.id}`}
                      name="price"
                      type="number"
                      min="0"
                      defaultValue={variant.price ?? ""}
                      placeholder="Base price"
                    />
                  </Field>
                  <Field label="Stock" htmlFor={`variant-stock-${variant.id}`}>
                    <Input
                      id={`variant-stock-${variant.id}`}
                      name="stockQuantity"
                      type="number"
                      min="0"
                      defaultValue={variant.stockQuantity}
                    />
                  </Field>
                  <div className="flex items-center gap-2 pb-1">
                    <label className="flex items-center gap-1.5 text-xs text-slate">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={variant.isActive}
                        className="h-4 w-4 rounded border-line text-brand"
                      />
                      Active
                    </label>
                    <SubmitButton variant="outline" size="sm" pendingText="Saving…">
                      Save
                    </SubmitButton>
                  </div>
                </form>
                <form action={deleteVariantAction} className="mt-1">
                  <input type="hidden" name="variantId" value={variant.id} />
                  <input type="hidden" name="productId" value={product.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:underline"
                  >
                    <Trash2 className="h-3 w-3" /> Remove variant
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-6 text-sm text-slate">
            No variants yet. Add options such as colour or storage capacity below.
          </p>
        )}

        <div className="border-t border-line bg-soft/40 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Plus className="h-4 w-4 text-brand" /> Add a variant
          </h3>
          <form action={saveVariantAction} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
            <input type="hidden" name="productId" value={product.id} />
            <Field label="Variant name" required htmlFor="new-variant-name">
              <Input
                id="new-variant-name"
                name="name"
                placeholder="128GB — Blue"
                required
              />
            </Field>
            <Field label="SKU" required htmlFor="new-variant-sku">
              <Input id="new-variant-sku" name="sku" placeholder="SKU-VARIANT-01" required />
            </Field>
            <Field label="Price (KES)" htmlFor="new-variant-price">
              <Input id="new-variant-price" name="price" type="number" min="0" placeholder="Optional" />
            </Field>
            <Field label="Stock" htmlFor="new-variant-stock">
              <Input id="new-variant-stock" name="stockQuantity" type="number" min="0" defaultValue={0} />
            </Field>
            <div className="flex items-center gap-3 pb-1">
              <label className="flex items-center gap-1.5 text-xs text-slate">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked
                  className="h-4 w-4 rounded border-line text-brand"
                />
                Active
              </label>
              <SubmitButton size="sm" pendingText="Adding…">
                Add
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white">
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4 text-brand" /> Recent stock movements
          </h2>
        </div>
        {movements.length > 0 ? (
          <ul className="divide-y divide-line">
            {movements.map((movement) => (
              <li key={movement.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs">
                <div>
                  <p className="font-medium text-ink">{movement.reason}</p>
                  <p className="text-slate">
                    {formatDateTime(movement.createdAt)}
                    {movement.user?.name ? ` · ${movement.user.name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={movement.quantityChange >= 0 ? "green" : "red"}>
                    {movement.quantityChange >= 0 ? "+" : ""}
                    {movement.quantityChange}
                  </Badge>
                  <span className="text-slate">
                    {movement.previousQuantity} → {movement.newQuantity}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-6 text-sm text-slate">No stock movements recorded yet.</p>
        )}
      </div>
    </div>
  );
}
