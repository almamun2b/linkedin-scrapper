import { cn } from "@/lib/cn";

const TYPES = [
  { key: "people", label: "People", enabled: true },
  { key: "companies", label: "Companies", enabled: false },
  { key: "services", label: "Services", enabled: false },
] as const;

export function ResultTypeTabs() {
  return (
    <div className="flex w-fit gap-1 rounded-md border border-border p-1">
      {TYPES.map((type) => (
        <span
          key={type.key}
          title={type.enabled ? undefined : "Coming soon"}
          className={cn(
            "rounded-sm px-3 py-1 text-sm font-medium",
            type.enabled
              ? "bg-primary text-primary-foreground"
              : "cursor-not-allowed text-muted-foreground opacity-50",
          )}
        >
          {type.label}
        </span>
      ))}
    </div>
  );
}
