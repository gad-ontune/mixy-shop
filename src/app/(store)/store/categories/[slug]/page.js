import Link from "next/link";
import { ChevronRight, PackageX, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CatalogFilters, CatalogFiltersMobile } from "@/components/store/catalog-filters";
import { Pagination } from "@/components/store/pagination";
import { ProductCard } from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatNumber } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const productInclude = {
  images: { take: 1, orderBy: { sortOrder: "asc" } },
  category: true,
  brand: true,
  variants: { where: { isActive: true } },
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description:
      category.description || `Shop ${category.name.toLowerCase()} at MIX Store in Nairobi.`,
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category || !category.isActive) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={PackageX}
          title="Category not found"
          description="This category may have been renamed or removed. Browse the full store instead."
          action={<Link href="/store" className={buttonVariants()}>Back to MIX Store</Link>}
        />
      </div>
    );
  }

  const page = Math.max(1, Number.parseInt(query?.page, 10) || 1);
  const brandSlug = typeof query?.brand === "string" ? query.brand : "";
  const minPrice = Number.parseInt(query?.minPrice, 10);
  const maxPrice = Number.parseInt(query?.maxPrice, 10);
  const inStock = query?.inStock === "1";
  const sort = typeof query?.sort === "string" ? query.sort : "featured";

  const brand = brandSlug
    ? await prisma.brand.findUnique({ where: { slug: brandSlug } })
    : null;

  const where = {
    categoryId: category.id,
    isActive: true,
    ...(brand ? { brandId: brand.id } : {}),
    ...(Number.isFinite(minPrice) || Number.isFinite(maxPrice)
      ? {
          price: {
            ...(Number.isFinite(minPrice) ? { gte: minPrice } : {}),
            ...(Number.isFinite(maxPrice) ? { lte: maxPrice } : {}),
          },
        }
      : {}),
    ...(inStock
      ? {
          AND: [
            {
              OR: [
                { stockQuantity: { gt: 0 } },
                { variants: { some: { isActive: true, stockQuantity: { gt: 0 } } } },
              ],
            },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "price-asc"
      ? [{ price: "asc" }]
      : sort === "price-desc"
        ? [{ price: "desc" }]
        : sort === "newest"
          ? [{ createdAt: "desc" }]
          : sort === "name"
            ? [{ name: "asc" }]
            : [{ isFeatured: "desc" }, { updatedAt: "desc" }];

  const [products, total, brands, settings] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.brand.findMany({
      where: { products: { some: { categoryId: category.id, isActive: true } } },
      orderBy: { name: "asc" },
    }),
    getSettings(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filters = (
    <CatalogFilters
      action={`/store/categories/${category.slug}`}
      brands={brands}
      searchParams={query || {}}
      hideCategory
    />
  );

  return (
    <>
      <div className="border-b border-line bg-soft/40">
        <div className="container-page py-8 sm:py-10">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate" aria-label="Breadcrumb">
            <Link href="/store" className="hover:text-brand">Store</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/store#categories" className="hover:text-brand">Categories</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink">{category.name}</span>
          </nav>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{category.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">
            {category.description ||
              `Browse ${category.name.toLowerCase()} available at MIX Store.`}
          </p>
          <p className="mt-2 text-xs text-slate">{formatNumber(total)} products</p>
        </div>
      </div>

      <div className="container-page py-8">
        <CatalogFiltersMobile>{filters}</CatalogFiltersMobile>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:items-start">
          <aside className="sticky top-32 hidden rounded-xl border border-line bg-white p-5 lg:block">
            <h2 className="mb-4 text-sm font-semibold">Filter products</h2>
            {filters}
          </aside>

          <div>
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {products.map((product, index) => (
                    <ProductCard key={product.id} product={product} priority={index < 3} />
                  ))}
                </div>
                <Pagination
                  basePath={`/store/categories/${category.slug}`}
                  searchParams={query}
                  page={page}
                  totalPages={totalPages}
                />
              </>
            ) : (
              <EmptyState
                icon={PackageX}
                title="No products match these filters"
                description="Try widening the price range, removing the brand filter, or viewing the full category."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link href={`/store/categories/${category.slug}`} className={buttonVariants()}>
                      Clear filters
                    </Link>
                    <Link href="/store/search" className={buttonVariants({ variant: "outline" })}>
                      <Search className="h-4 w-4" /> Search all products
                    </Link>
                  </div>
                }
              />
            )}

            <div className="mt-8 rounded-xl border border-line bg-soft/50 p-4 text-xs leading-5 text-slate">
              <p className="font-semibold text-ink">Collection and delivery</p>
              <p className="mt-1">
                Collect at {settings.address}, or choose delivery at checkout where available.
                Delivery starts from {new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(settings.deliveryFee)}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
