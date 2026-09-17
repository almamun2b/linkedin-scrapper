import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

const badgeStyles = cva("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", {
  variants: {
    tone: {
      neutral: "bg-[--color-bg] text-[--color-muted]",
      accent: "bg-[--color-accent]/10 text-[--color-accent]",
      success: "bg-[--color-success]/10 text-[--color-success]",
      danger: "bg-[--color-danger]/10 text-[--color-danger]",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface BadgeProps extends VariantProps<typeof badgeStyles> {
  children: ReactNode;
  className?: string;
}

export function Badge({ tone, children, className }: BadgeProps) {
  return <span className={cn(badgeStyles({ tone }), className)}>{children}</span>;
}
