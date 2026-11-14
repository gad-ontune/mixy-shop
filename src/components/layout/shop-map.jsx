import { ExternalLink, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const MAPS_BASE = "https://www.google.com/maps";

/**
 * Embedded Google Map pointing at the shop address, with a directions link.
 * The address comes from business settings so the map always matches the
 * address shown on the website and in the footer.
 */
export function ShopMap({ address, className }) {
  const query = encodeURIComponent(address);

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-line bg-soft", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-4 py-3">
        <p className="flex items-center gap-2 text-xs font-medium text-ink">
          <MapPin className="h-4 w-4 shrink-0 text-brand" /> {address}
        </p>
        <a
          href={`${MAPS_BASE}/search/?api=1&query=${query}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-700"
        >
          Get directions <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <iframe
        title={`Map to ${address}`}
        src={`${MAPS_BASE}?q=${query}&output=embed`}
        className="h-[300px] w-full border-0 sm:h-[360px]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
