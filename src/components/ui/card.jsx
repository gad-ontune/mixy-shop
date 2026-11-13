import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }) {
  return (
    <div className={cn("card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, title, description, action }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6", className)}>
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-slate">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("p-5 sm:p-6", className)}>{children}</div>;
}
