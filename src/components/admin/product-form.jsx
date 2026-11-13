import Link from "next/link";
import { Save } from "lucide-react";
import { saveProductAction } from "@/actions/admin";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

function specsToText(specs) {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return "";
  return Object.entries(specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

export function ProductForm({ product, categories, brands, cancelHref = "/admin/products" }) {
  const images = product?.images || [];

  return (
    <form action={saveProductAction} className="space-y-5">
      {product?.id ? <input type="hidden" name="productId" value={product.id} /> : null}

      <div className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-sm font-semibold">Basic information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Product name" required htmlFor="name" className="sm:col-span-2">
            <Input id="name" name="name" defaultValue={product?.name || ""} required maxLength={160} />
          </Field>
          <Field label="SKU" required htmlFor="sku" hint="Unique stock keeping unit.">
            <Input id="sku" name="sku" defaultValue={product?.sku || ""} required maxLength={60} />
          </Field>
          <Field label="Brand" htmlFor="brandId">
            <Select id="brandId" name="brandId" defaultValue={product?.brandId || ""}>
              <option value="">No brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category" required htmlFor="categoryId" className="sm:col-span-2">
            <Select id="categoryId" name="categoryId" defaultValue={product?.categoryId || ""} required>
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Description"
            required
            htmlFor="description"
            className="sm:col-span-2"
            hint="At least 20 characters. This appears on the product page."
          >
            <Textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={product?.description || ""}
              required
              maxLength={6000}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-sm font-semibold">Pricing and stock</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Price (KES)" required htmlFor="price">
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="1"
              defaultValue={product?.price ?? 0}
              required
            />
          </Field>
          <Field label="Compare-at price (KES)" htmlFor="compareAtPrice" hint="Optional original price.">
            <Input
              id="compareAtPrice"
              name="compareAtPrice"
              type="number"
              min="0"
              step="1"
              defaultValue={product?.compareAtPrice ?? ""}
            />
          </Field>
          <Field
            label="Stock quantity"
            htmlFor="stockQuantity"
            hint={product?.id ? "Use Inventory or variants to change stock." : "Opening stock."}
          >
            <Input
              id="stockQuantity"
              name="stockQuantity"
              type="number"
              min="0"
              step="1"
              defaultValue={product?.stockQuantity ?? 0}
              readOnly={Boolean(product?.id)}
              className={product?.id ? "bg-soft" : ""}
            />
          </Field>
          <Field label="Low stock alert at" htmlFor="lowStockAt">
            <Input
              id="lowStockAt"
              name="lowStockAt"
              type="number"
              min="0"
              step="1"
              defaultValue={product?.lowStockAt ?? 5}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-sm font-semibold">Media and details</h2>
        <div className="mt-4 space-y-4">
          <Field
            label="Primary image URL"
            htmlFor="imageUrl"
            hint="Paste an https image URL. Private uploads are not used for catalogue images."
          >
            <Input
              id="imageUrl"
              name="imageUrl"
              defaultValue={images[0]?.url || ""}
              placeholder="https://images.unsplash.com/…"
              maxLength={500}
            />
          </Field>
          <Field
            label="Specifications"
            htmlFor="specs"
            hint="One per line, in the form “Key: value”, e.g. Display: 6.1-inch."
          >
            <Textarea
              id="specs"
              name="specs"
              rows={5}
              defaultValue={specsToText(product?.specs)}
              placeholder={"Display: 6.1-inch\nBattery: 5,000 mAh\nWarranty: 12 months"}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-sm font-semibold">Visibility</h2>
        <div className="mt-3 space-y-2.5">
          {[
            ["isActive", "Visible in the store", product ? product.isActive : true],
            ["isFeatured", "Featured on the store home", product?.isFeatured || false],
            ["isNewArrival", "Show in new arrivals", product?.isNewArrival || false],
          ].map(([name, label, checked]) => (
            <label key={name} className="flex items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                name={name}
                defaultChecked={checked}
                className="h-4 w-4 rounded border-line text-brand focus:ring-brand/25"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingText="Saving product…">
          <Save className="h-4 w-4" /> Save product
        </SubmitButton>
        <Link href={cancelHref} className="text-sm font-medium text-slate hover:text-ink">
          Cancel
        </Link>
      </div>
    </form>
  );
}
