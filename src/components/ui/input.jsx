import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-ink placeholder:text-slate/70 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-soft",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "flex w-full rounded-lg border border-line bg-white px-3.5 py-3 text-sm text-ink placeholder:text-slate/70 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-soft",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "flex h-11 w-full appearance-none rounded-lg border border-line bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%2364748B%22 stroke-width=%221.7%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m4 6 4 4 4-4%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat px-3.5 py-2 pr-10 text-sm text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, children, required, ...props }) {
  return (
    <label className={cn("field-label", className)} {...props}>
      {children}
      {required ? <span className="ml-0.5 text-red-600">*</span> : null}
    </label>
  );
}

export function Field({ label, required, hint, error, htmlFor, children, className }) {
  return (
    <div className={className}>
      {label ? (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      ) : null}
      {children}
      {hint && !error ? <p className="field-hint">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
