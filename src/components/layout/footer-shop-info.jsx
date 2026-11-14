"use client";

import { usePathname } from "next/navigation";
import { MapPin, Clock } from "lucide-react";

/**
 * Shop address and opening hours in the footer.
 * These are deliberately hidden inside the customer account area so that the
 * physical shop location only appears on the public website.
 */
export function FooterShopInfo({ address, openingHours }) {
  const pathname = usePathname();

  if (pathname.startsWith("/account")) return null;

  return (
    <>
      <p className="flex items-start gap-2.5">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {address}
      </p>
      <p className="flex items-start gap-2.5">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {openingHours}
      </p>
    </>
  );
}
