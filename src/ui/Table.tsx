import type { ReactNode } from "react";
import { cn } from "./cn";

/** A plain table shell — not a data-grid abstraction (ARCHITECTURE §11: no @tanstack/react-table). */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-[--radius-card] border border-[--color-border]", className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-[--color-border] bg-[--color-bg] text-left text-xs uppercase text-[--color-muted]">
      {children}
    </thead>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2 font-medium", className)}>{children}</th>;
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[--color-border]">{children}</tbody>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2 align-middle", className)}>{children}</td>;
}
