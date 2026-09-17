import { ComingSoonFilterFields } from "./filters/ComingSoonFilterFields";

export function AllFiltersDrawer() {
  return (
    <details className="rounded-[--radius-card] border border-[--color-border] p-3">
      <summary className="cursor-pointer text-sm font-medium text-[--color-fg]">All filters</summary>
      <div className="mt-3">
        <ComingSoonFilterFields />
      </div>
    </details>
  );
}
