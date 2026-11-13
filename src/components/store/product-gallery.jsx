"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }) {
  const [active, setActive] = useState(0);
  const current = images[active] || images[0];

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-line bg-soft text-sm text-slate">
        No image available
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-soft">
        <Image
          src={current.url}
          alt={current.alt || name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {images.map((image, index) => (
            <button
              key={image.id || index}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-soft",
                index === active ? "border-brand ring-1 ring-brand" : "border-line",
              )}
              aria-label={`View image ${index + 1}`}
            >
              <Image src={image.url} alt={image.alt || name} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
