import { cn } from "@/lib/utils";

export function TableWrapper({ className, children }) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ className, children, ...props }) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line bg-soft/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({ className, children, ...props }) {
  return (
    <td className={cn("border-b border-line px-4 py-3.5 align-middle text-sm text-ink", className)} {...props}>
      {children}
    </td>
  );
}
