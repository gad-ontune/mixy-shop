import { cn } from "@/lib/utils";

/** Renders the ?ok= / ?error= flash message used by admin forms. */
export function AdminFlash({ searchParams, className }) {
  const ok = typeof searchParams?.ok === "string" ? searchParams.ok : "";
  const error = typeof searchParams?.error === "string" ? searchParams.error : "";
  const forbidden = typeof searchParams?.forbidden === "string" ? searchParams.forbidden : "";

  if (!ok && !error && !forbidden) return null;

  const tone = error || forbidden ? "red" : "green";
  const message = error || (forbidden ? "You do not have permission to view that page." : ok);

  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        tone === "red"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900",
        className,
      )}
    >
      {message}
    </div>
  );
}
