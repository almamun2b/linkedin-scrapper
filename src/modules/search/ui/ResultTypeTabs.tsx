const TYPES = [
  { key: "people", label: "People", enabled: true },
  { key: "companies", label: "Companies", enabled: false },
  { key: "services", label: "Services", enabled: false },
] as const;

export function ResultTypeTabs() {
  return (
    <div className="flex gap-1 rounded-md border border-[--color-border] p-1 w-fit">
      {TYPES.map((type) => (
        <span
          key={type.key}
          title={type.enabled ? undefined : "Coming soon"}
          className={
            type.enabled
              ? "rounded px-3 py-1 text-sm font-medium bg-[--color-accent] text-white"
              : "rounded px-3 py-1 text-sm text-[--color-muted] opacity-50 cursor-not-allowed"
          }
        >
          {type.label}
        </span>
      ))}
    </div>
  );
}
