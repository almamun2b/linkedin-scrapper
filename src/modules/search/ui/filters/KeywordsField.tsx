export function KeywordsField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
      Keywords
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. product manager"
        className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm"
      />
    </label>
  );
}
