import { cn } from "@/lib/cn";

function initialsFrom(name: string | null | undefined, email: string | null | undefined): string {
  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim();
  const source =
    trimmedName && trimmedName.length > 0
      ? trimmedName
      : trimmedEmail && trimmedEmail.length > 0
        ? trimmedEmail
        : "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function Avatar({
  name,
  email,
  className,
}: {
  name?: string | null;
  email?: string | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary",
        className,
      )}
    >
      {initialsFrom(name, email)}
    </span>
  );
}
