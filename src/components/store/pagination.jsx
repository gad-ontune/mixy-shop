import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function buildHref(basePath, searchParams, page) {
  const params = new URLSearchParams();
  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (key === "page" || value == null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    } else {
      params.set(key, String(value));
    }
  });
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({ basePath, searchParams, page, totalPages }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let index = Math.max(1, end - 4); index <= end; index += 1) pages.push(index);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-between gap-3" aria-label="Pagination">
      <p className="text-xs text-slate">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(basePath, searchParams, Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={cn(
            "grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-slate hover:border-brand/40 hover:text-brand",
            page <= 1 && "pointer-events-none opacity-40",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        {pages.map((entry) => (
          <Link
            key={entry}
            href={buildHref(basePath, searchParams, entry)}
            className={cn(
              "grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm font-medium",
              entry === page
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-ink hover:border-brand/40 hover:text-brand",
            )}
          >
            {entry}
          </Link>
        ))}
        <Link
          href={buildHref(basePath, searchParams, Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={cn(
            "grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-slate hover:border-brand/40 hover:text-brand",
            page >= totalPages && "pointer-events-none opacity-40",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </nav>
  );
}
