import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, children, className, align = "left" }) {
  return (
    <section className={cn("border-b border-line bg-soft/40", className)}>
      <div className={cn("container-page py-12 sm:py-16", align === "center" && "text-center")}>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-[2.75rem]">
          {title}
        </h1>
        {description ? (
          <p className={cn("mt-3 max-w-2xl text-[15px] leading-7 text-slate", align === "center" && "mx-auto")}>
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
