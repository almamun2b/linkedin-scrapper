import type { ReactNode, TdHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** A plain table shell — not a data-grid abstraction (ARCHITECTURE §11: no @tanstack/react-table). */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-border bg-card shadow-card",
        className,
      )}
    >
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border bg-surface-muted text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </thead>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("px-4 py-2.5 font-semibold", className)}>{children}</th>;
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("transition-colors hover:bg-surface-muted", className)}>{children}</tr>;
}

export function Td({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-2.5 align-middle tabular-nums", className)} {...props}>
      {children}
    </td>
  );
}
