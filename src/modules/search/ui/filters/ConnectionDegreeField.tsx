import { cn } from "@/lib/cn";
import type { ConnectionDegree } from "../../domain/filters";

const OPTIONS: { value: ConnectionDegree; label: string }[] = [
  { value: "1", label: "1st" },
  { value: "2", label: "2nd" },
  { value: "3+", label: "3rd+" },
];

export function ConnectionDegreeField({
  value,
  onChange,
}: {
  value: ConnectionDegree[];
  onChange: (value: ConnectionDegree[]) => void;
}) {
  function toggle(degree: ConnectionDegree) {
    onChange(value.includes(degree) ? value.filter((d) => d !== degree) : [...value, degree]);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground">Connections</span>
      <div className="flex gap-1.5">
        {OPTIONS.map((option) => {
          const active = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                toggle(option.value);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary-subtle text-primary"
                  : "border-border text-muted-foreground hover:bg-surface-muted",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
