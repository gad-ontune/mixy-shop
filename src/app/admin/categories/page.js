import Link from "next/link";
import Image from "next/image";
import { Plus, Layers, Trash2, Save, Tag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/constants";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import {
  saveCategoryAction,
  deleteCategoryAction,
  saveBrandAction,
} from "@/actions/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage({ searchParams }) {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE, "/admin/categories");
  const params = await searchParams;

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    }),
  ]);

  return (
    <div className="space-y-5">
      <AdminFlash searchParams={params} />
      <AdminHeader
        title="Categories and brands"
        description="Organise the catalogue so customers can browse the store easily."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-line bg-white">
          <div className="border-b border-line px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Layers className="h-4 w-4 text-brand" /> Categories
            </h2>
          </div>
          <div className="border-b border-line bg-soft/40 p-5">
            <h3 className="text-sm font-semibold">Add a category</h3>
            <form action={saveCategoryAction} className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Name" required htmlFor="new-category-name">
                <Input id="new-category-name" name="name" placeholder="Audio" required />
              </Field>
              <Field label="Slug" htmlFor="new-category-slug" hint="Optional; generated from the name.">
                <Input id="new-category-slug" name="slug" placeholder="audio" />
              </Field>
              <Field label="Description" htmlFor="new-category-description" className="sm:col-span-2">
                <Textarea id="new-category-description" name="description" rows={2} maxLength={500} />
              </Field>
              <Field label="Image URL" htmlFor="new-category-image">
                <Input id="new-category-image" name="imageUrl" placeholder="https://…" />
              </Field>
              <Field label="Sort order" htmlFor="new-category-sort">
                <Input id="new-category-sort" name="sortOrder" type="number" min="0" defaultValue={0} />
              </Field>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked
                  className="h-4 w-4 rounded border-line text-brand"
                />
                Active
              </label>
              <div className="sm:col-span-2">
                <SubmitButton pendingText="Saving…">
                  <Plus className="h-4 w-4" /> Add category
                </SubmitButton>
              </div>
            </form>
          </div>

          <ul className="divide-y divide-line">
            {categories.map((category) => (
              <li key={category.id} className="px-5 py-4">
                <details>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-soft">
                        {category.imageUrl ? (
                          <Image
                            src={category.imageUrl}
                            alt={category.name}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : (
                          <Layers className="h-4 w-4 text-slate" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ink">{category.name}</p>
                        <p className="text-[11px] text-slate">
                          /{category.slug} · {category._count.products} product
                          {category._count.products === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={category.isActive ? "green" : "slate"}>
                        {category.isActive ? "Active" : "Hidden"}
                      </Badge>
                      <span className="text-[11px] font-medium text-brand">Edit</span>
                    </div>
                  </summary>

                  <form action={saveCategoryAction} className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="categoryId" value={category.id} />
                    <Field label="Name" htmlFor={`cat-name-${category.id}`}>
                      <Input id={`cat-name-${category.id}`} name="name" defaultValue={category.name} required />
                    </Field>
                    <Field label="Slug" htmlFor={`cat-slug-${category.id}`}>
                      <Input id={`cat-slug-${category.id}`} name="slug" defaultValue={category.slug} required />
                    </Field>
                    <Field label="Description" htmlFor={`cat-desc-${category.id}`} className="sm:col-span-2">
                      <Textarea
                        id={`cat-desc-${category.id}`}
                        name="description"
                        rows={2}
                        defaultValue={category.description || ""}
                      />
                    </Field>
                    <Field label="Image URL" htmlFor={`cat-img-${category.id}`}>
                      <Input
                        id={`cat-img-${category.id}`}
                        name="imageUrl"
                        defaultValue={category.imageUrl || ""}
                      />
                    </Field>
                    <Field label="Sort order" htmlFor={`cat-sort-${category.id}`}>
                      <Input
                        id={`cat-sort-${category.id}`}
                        name="sortOrder"
                        type="number"
                        min="0"
                        defaultValue={category.sortOrder}
                      />
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={category.isActive}
                        className="h-4 w-4 rounded border-line text-brand"
                      />
                      Active
                    </label>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <SubmitButton size="sm" pendingText="Saving…">
                        <Save className="h-3.5 w-3.5" /> Save
                      </SubmitButton>
                    </div>
                  </form>

                  {category._count.products === 0 ? (
                    <form action={deleteCategoryAction} className="mt-2">
                      <input type="hidden" name="categoryId" value={category.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:underline"
                      >
                        <Trash2 className="h-3 w-3" /> Delete category
                      </button>
                    </form>
                  ) : null}
                </details>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-line bg-white">
          <div className="border-b border-line px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Tag className="h-4 w-4 text-brand" /> Brands
            </h2>
          </div>
          <div className="border-b border-line bg-soft/40 p-5">
            <h3 className="text-sm font-semibold">Add a brand</h3>
            <form action={saveBrandAction} className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Brand name" required htmlFor="new-brand-name">
                <Input id="new-brand-name" name="name" placeholder="Anker" required />
              </Field>
              <Field label="Logo URL" htmlFor="new-brand-logo">
                <Input id="new-brand-logo" name="logoUrl" placeholder="https://…" />
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton pendingText="Saving…">
                  <Plus className="h-4 w-4" /> Add brand
                </SubmitButton>
              </div>
            </form>
          </div>

          <ul className="divide-y divide-line">
            {brands.map((brand) => (
              <li key={brand.id} className="px-5 py-3">
                <form action={saveBrandAction} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="brandId" value={brand.id} />
                  <Field label="Brand" htmlFor={`brand-${brand.id}`} className="flex-1">
                    <Input id={`brand-${brand.id}`} name="name" defaultValue={brand.name} required />
                  </Field>
                  <Field label="Logo URL" htmlFor={`brand-logo-${brand.id}`} className="flex-1">
                    <Input
                      id={`brand-logo-${brand.id}`}
                      name="logoUrl"
                      defaultValue={brand.logoUrl || ""}
                    />
                  </Field>
                  <div className="flex items-center gap-2 pb-0.5">
                    <span className="text-[11px] text-slate">{brand._count.products} products</span>
                    <SubmitButton variant="outline" size="sm" pendingText="Saving…">
                      Save
                    </SubmitButton>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
