import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[--color-accent] text-[--color-accent-fg] hover:opacity-90",
        secondary: "border border-[--color-border] bg-[--color-surface] text-[--color-fg] hover:bg-[--color-bg]",
        danger: "bg-[--color-danger] text-white hover:opacity-90",
        ghost: "text-[--color-fg] hover:bg-[--color-bg]",
      },
      size: {
        sm: "px-2.5 py-1.5 text-xs",
        md: "px-3.5 py-2",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
