import type { ComponentProps } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { buttonVariants, type ButtonProps } from "./Button";

export interface ButtonLinkProps
  extends ComponentProps<typeof Link>, Pick<ButtonProps, "variant" | "size"> {}

export function ButtonLink({ className, variant, size, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
