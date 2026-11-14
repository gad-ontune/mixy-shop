import Link from "next/link";
import { ChevronRight, PackageX, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CatalogFilters, CatalogFiltersMobile } from "@/components/store/catalog-filters";
import { Pagination } from "@/components/store/pagination";
import { ProductCard } from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const productInclude = {
  images: { take: 1, orderBy: { sortOrder: "asc" } },
  category: true,
  brand: true,
  variants: { where: { isActive: true } },
};

export const metadata = {
  title: "Search products",
  description:
    "Search electronics, phone accessories and everyday technology available at MIX Store in Kehancha, Migori County.",
};

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function SearchPage({ searchParams }) {
  const query = await searchParams;
  const q = text(query?.q);
  const categorySlug = text(query?.category);
  const brandSlug = text(query?.brand);
  const page = Math.max(1, Number.parseInt(query?.page, 10) || 1);
  const minPrice = Number.parseInt(query?.minPrice, 10);
  const maxPrice = Number.parseInt(query?.maxPrice, 10);
  const inStock = query?.inStock === "1";
  const onlyNew = query?.new === "1";
  const sort = text(query?.sort) || "featured";

  const and = [{ isActive: true }];

  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { brand: { name: { contains: q, mode: "insensitive" } } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (categorySlug) and.push({ category: { slug: categorySlug } });
  if (brandSlug) and.push({ brand: { slug: brandSlug } });
  if (onlyNew) and.push({ isNewArrival: true });
  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    and.push({
      price: {
        ...(Number.isFinite(minPrice) ? { gte: minPrice } : {}),
        ...(Number.isFinite(maxPrice) ? { lte: maxPrice } : {}),
      },
    });
  }
  if (inStock) {
    and.push({
      OR: [
        { stockQuantity: { gt: 0 } },
        { variants: { some: { isActive: true, stockQuantity: { gt: 0 } } } },
      ],
    });
  }

  const where = { AND: and };

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

  const [products, total, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.brand.findMany({
      where: { products: { some: { isActive: true } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeFilters = [q && `“${q}”`, categorySlug, brandSlug, onlyNew && "New arrivals"].filter(
    Boolean,
  );

  const filters = (
    <CatalogFilters
      action="/store/search"
      categories={categories}
      brands={brands}
      searchParams={query || {}}
      showNewFilter
    />
  );

  return (
    <>
      <div className="border-b border-line bg-soft/40">
        <div className="container-page py-8 sm:py-10">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate" aria-label="Breadcrumb">
            <Link href="/store" className="hover:text-brand">Store</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink">Search</span>
          </nav>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            {q ? `Search results for “${q}”` : "Browse all products"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">
            Search across product names, brands and categories. Use the filters to narrow by
            category, brand, price and availability.
          </p>
          <p className="mt-2 text-xs text-slate">{formatNumber(total)} products found</p>
          {activeFilters.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {activeFilters.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-slate"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
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
                  basePath="/store/search"
                  searchParams={query}
                  page={page}
                  totalPages={totalPages}
                />
              </>
            ) : (
              <EmptyState
                icon={PackageX}
                title="No products matched your search"
                description={
                  q
                    ? `We could not find anything for “${q}”. Try a different term, remove a filter, or browse all products.`
                    : "Try widening the price range or removing a filter."
                }
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link href="/store/search" className={buttonVariants()}>
                      Clear filters
                    </Link>
                    <Link href="/store" className={buttonVariants({ variant: "outline" })}>
                      <Search className="h-4 w-4" /> Back to store
                    </Link>
                  </div>
                }
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
