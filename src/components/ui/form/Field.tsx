import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Label + control + hint/error, matching the codebase's existing pattern of nesting the
 * control inside the <label> (so no id/htmlFor plumbing is needed at every call site).
 */
export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={cn("flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground", className)}
    >
      {label}
      {children}
      {error ? (
        <span className="text-xs font-normal text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs font-normal text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
