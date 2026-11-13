import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/constants";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "New product" };

export default async function NewProductPage({ searchParams }) {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE, "/admin/products");
  const params = await searchParams;

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-5">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-brand"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All products
      </Link>
      <AdminFlash searchParams={params} />
      <AdminHeader
        title="Add a product"
        description="Create a product for the store. You can add images and options after saving."
      />
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
