import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";

/** Right-aligned icon-button cluster for a table's action column — replaces the wide text
 * `<Button size="sm">` pattern every table used before. Pair with `<Th className="text-right">`
 * / `<Td className="text-right">` on the action column. */
export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>;
}

export interface IconActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  tone?: "default" | "danger";
}

/** One icon-only action. `label` is both the tooltip content and the `aria-label` — an
 * icon alone has no accessible name otherwise, and a tooltip that only shows on hover would
 * leave keyboard users without the same explanation a text button gave for free. */
export function IconAction({ icon, label, tone = "default", className, ...props }: IconActionProps) {
  return (
    <Tooltip content={label}>
      <Button
        type={props.type ?? "button"}
        variant="ghost"
        size="icon"
        aria-label={label}
        className={cn("size-8", tone === "danger" && "text-danger hover:bg-danger-subtle", className)}
        {...props}
      >
        {icon}
      </Button>
    </Tooltip>
  );
}
