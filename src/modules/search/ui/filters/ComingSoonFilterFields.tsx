import { COMING_SOON_FILTERS } from "../../domain/filters";

/** One generic renderer for every reserved-but-unwired facet, driven by a config array —
 * keeps adding a ninth reserved facet a one-line change instead of a new component. */
export function ComingSoonFilterFields() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {COMING_SOON_FILTERS.map((filter) => (
        <label
          key={filter.key}
          className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground opacity-50"
        >
          {filter.label} <span className="text-[10px] font-normal">(coming soon)</span>
          <input
            disabled
            placeholder="—"
            className="h-9 rounded-md border border-border bg-input px-3 text-sm"
          />
        </label>
      ))}
    </div>
  );
}
