import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function DescriptionList({
  items,
  className,
}: {
  items: readonly { key: string; label: ReactNode; value: ReactNode }[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "divide-y divide-border rounded-lg border border-border bg-card shadow-card",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="text-right font-mono text-xs text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
