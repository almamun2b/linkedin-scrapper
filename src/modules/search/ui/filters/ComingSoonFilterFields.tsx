import { COMING_SOON_FILTERS } from "../../domain/filters";

/** One generic renderer for every reserved-but-unwired facet, driven by a config array —
 * keeps adding a ninth reserved facet a one-line change instead of a new component. */
export function ComingSoonFilterFields() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {COMING_SOON_FILTERS.map((filter) => (
        <label key={filter.key} className="flex flex-col gap-1 text-xs text-[--color-muted] opacity-50">
          {filter.label} <span className="text-[10px]">(coming soon)</span>
          <input disabled placeholder="—" className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm" />
        </label>
      ))}
    </div>
  );
}
