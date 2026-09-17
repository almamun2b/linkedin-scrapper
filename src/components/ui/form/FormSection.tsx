import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function FormSection({
  title,
  description,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className={cn("rounded-lg border border-border bg-card p-4 shadow-card", className)}>
      <legend className="px-1 text-xs font-semibold text-foreground">{title}</legend>
      {description ? (
        <p className="-mt-1 mb-3 text-xs text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </fieldset>
  );
}
