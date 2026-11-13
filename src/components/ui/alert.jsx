import { cn } from "@/lib/utils";

export function Alert({ tone = "blue", title, children, className }) {
  const tones = {
    blue: "border-brand-100 bg-brand-50 text-brand-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-red-200 bg-red-50 text-red-900",
    slate: "border-line bg-soft text-ink",
  };

  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone], className)} role="status">
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-0.5" : ""}>{children}</div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-soft/40 px-6 py-14 text-center", className)}>
      {Icon ? (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-white text-slate">
          <Icon className="h-5 w-5" strokeWidth={1.7} />
        </span>
      ) : null}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1.5 max-w-md text-sm leading-6 text-slate">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
