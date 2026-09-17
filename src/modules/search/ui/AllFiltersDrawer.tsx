import { ChevronDown } from "lucide-react";
import { ComingSoonFilterFields } from "./filters/ComingSoonFilterFields";

export function AllFiltersDrawer() {
  return (
    <details className="group rounded-lg border border-border p-3">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-foreground">
        All filters
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="mt-3">
        <ComingSoonFilterFields />
      </div>
    </details>
  );
}
