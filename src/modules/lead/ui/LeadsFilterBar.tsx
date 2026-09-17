export function LeadsFilterBar({ stage, hasEmail, company }: { stage?: string; hasEmail?: string; company?: string }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-[--radius-card] border border-[--color-border] bg-[--color-surface] p-3">
      <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
        Stage
        <select name="stage" defaultValue={stage ?? ""} className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm">
          <option value="">Any</option>
          <option value="STUB">Stub</option>
          <option value="SCRAPED">Scraped</option>
          <option value="ENRICHED">Enriched</option>
          <option value="FAILED">Failed</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
        Company contains
        <input name="company" defaultValue={company ?? ""} className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm" />
      </label>
      <label className="flex items-center gap-1.5 pb-1.5 text-xs text-[--color-muted]">
        <input type="checkbox" name="hasEmail" value="true" defaultChecked={hasEmail === "true"} />
        Has email only
      </label>
      <button type="submit" className="rounded-md border border-[--color-border] px-3 py-1.5 text-sm text-[--color-fg] hover:bg-[--color-bg]">
        Filter
      </button>
    </form>
  );
}
