import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "danger";
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <Icon
          aria-hidden="true"
          className={cn("size-4", tone === "danger" ? "text-danger" : "text-primary")}
        />
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums",
          tone === "danger" ? "text-danger" : "text-foreground",
        )}
      >
        {value}
      </p>
    </>
  );

  const className = "rounded-lg border border-border bg-card p-4 shadow-card";

  if (href) {
    return (
      <Link href={href} className={cn(className, "transition-colors hover:bg-surface-muted")}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
