import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button-variants";

export function CatalogFilters({
  action,
  categories = [],
  brands = [],
  searchParams = {},
  hideCategory = false,
  showNewFilter = false,
}) {
  const value = (key) => (typeof searchParams[key] === "string" ? searchParams[key] : "");

  return (
    <form action={action} method="get" className="space-y-5">
      {value("q") ? <input type="hidden" name="q" value={value("q")} /> : null}

      {!hideCategory && categories.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">Category</p>
          <Select name="category" defaultValue={value("category")}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {brands.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">Brand</p>
          <Select name="brand" defaultValue={value("brand")}>
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.slug}>
                {brand.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">Price range (KES)</p>
        <div className="flex items-center gap-2">
          <Input name="minPrice" type="number" min="0" placeholder="Min" defaultValue={value("minPrice")} className="h-10" />
          <span className="text-slate">–</span>
          <Input name="maxPrice" type="number" min="0" placeholder="Max" defaultValue={value("maxPrice")} className="h-10" />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">Sort by</p>
        <Select name="sort" defaultValue={value("sort") || "featured"}>
          <option value="featured">Recommended</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name: A–Z</option>
        </Select>
      </div>

      <div className="space-y-2.5">
        <label className="flex items-center gap-2.5 text-sm text-slate">
          <input type="checkbox" name="inStock" value="1" defaultChecked={value("inStock") === "1"} className="h-4 w-4 rounded border-line text-brand focus:ring-brand" />
          In stock only
        </label>
        {showNewFilter ? (
          <label className="flex items-center gap-2.5 text-sm text-slate">
            <input type="checkbox" name="new" value="1" defaultChecked={value("new") === "1"} className="h-4 w-4 rounded border-line text-brand focus:ring-brand" />
            New arrivals only
          </label>
        ) : null}
      </div>

      <div className="flex gap-2">
        <button type="submit" className={`${buttonVariants()} flex-1`}>
          <SlidersHorizontal className="h-4 w-4" /> Apply
        </button>
        <Link href={action} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Clear filters">
          <X className="h-4 w-4" />
        </Link>
      </div>
    </form>
  );
}

export function CatalogFiltersMobile({ children }) {
  return (
    <details className="mb-5 rounded-xl border border-line bg-white lg:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-ink">
        <SlidersHorizontal className="h-4 w-4 text-brand" /> Filters and sorting
      </summary>
      <div className="border-t border-line p-4">{children}</div>
    </details>
  );
}
