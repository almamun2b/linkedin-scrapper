import Link from "next/link";
import { cn } from "@/lib/cn";

export function FilterChips({
  items,
}: {
  items: readonly { key: string; label: string; href: string; active: boolean }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.active ? "true" : undefined}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            item.active
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:bg-surface-muted",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
