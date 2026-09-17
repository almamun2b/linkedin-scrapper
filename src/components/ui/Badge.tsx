import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-surface-muted text-muted-foreground",
        accent: "bg-primary-subtle text-primary",
        success: "bg-success-subtle text-success",
        warning: "bg-warning-subtle text-warning",
        danger: "bg-danger-subtle text-danger",
      } satisfies Record<BadgeTone, string>,
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const DOT_TONE = {
  neutral: "bg-muted-foreground",
  accent: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
} as const;

export function Badge({ tone = "neutral", children, className, dot }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)}>
      {dot ? (
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOT_TONE[tone])} />
      ) : null}
      {children}
    </span>
  );
}
