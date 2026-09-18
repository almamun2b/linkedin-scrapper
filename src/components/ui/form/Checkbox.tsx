import type { InputHTMLAttributes, ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip } from "../Tooltip";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  hint?: ReactNode;
  help?: ReactNode;
}

export function Checkbox({ label, hint, help, className, id, ...props }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn("flex cursor-pointer items-start gap-2 text-sm text-foreground", className)}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded-sm border-border-strong text-primary accent-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        {...props}
      />
      <span>
        <span className="inline-flex items-center gap-1">
          {label}
          {help ? (
            <Tooltip content={help}>
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
        {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </label>
  );
}
