import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

const ALERT_STYLES = {
  info: { icon: Info, className: "border-border bg-surface-muted text-foreground" },
  success: { icon: CheckCircle2, className: "border-success/20 bg-success-subtle text-success" },
  warning: { icon: AlertTriangle, className: "border-warning/20 bg-warning-subtle text-warning" },
  error: { icon: XCircle, className: "border-danger/20 bg-danger-subtle text-danger" },
} as const;

export function Alert({
  tone = "error",
  children,
  className,
}: {
  tone?: keyof typeof ALERT_STYLES;
  children: ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: toneClassName } = ALERT_STYLES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-md border p-3 text-sm",
        toneClassName,
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
