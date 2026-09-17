export function NumberField({ label, name, defaultValue }: { label: string; name: string; defaultValue: number }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
      {label}
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm"
      />
    </label>
  );
}
