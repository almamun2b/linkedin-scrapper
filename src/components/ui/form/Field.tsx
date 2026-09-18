import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip } from "../Tooltip";

/**
 * Label + control + hint/error, matching the codebase's existing pattern of nesting the
 * control inside the <label> (so no id/htmlFor plumbing is needed at every call site).
 * `help` is an on-demand explanation surfaced via a small info icon on hover *and* keyboard
 * focus (not the always-visible `hint` below the control) — for config fields like
 * `leaseSeconds` or `profileDelayMinMs` whose purpose isn't obvious from the label alone.
 */
export function Field({
  label,
  hint,
  help,
  error,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  help?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={cn("flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground", className)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {help ? (
          <Tooltip content={help}>
            {/* A real <button>, not a styled <span> — this label wraps a form control, and
             * only a genuinely interactive element stops the browser from also forwarding
             * the click to that control (a span with role="button" would not). */}
            <button
              type="button"
              aria-label="What is this setting?"
              onClick={(event) => { event.preventDefault(); }}
              className="inline-flex text-muted-foreground/70 hover:text-muted-foreground"
            >
              <Info aria-hidden="true" className="size-3" />
            </button>
          </Tooltip>
        ) : null}
      </span>
      {children}
      {error ? (
        <span className="text-xs font-normal text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs font-normal text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
