import type { ConnectionDegree } from "../../domain/filters";

const OPTIONS: Array<{ value: ConnectionDegree; label: string }> = [
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
      <span className="text-xs text-[--color-muted]">Connections</span>
      <div className="flex gap-3">
        {OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-1.5 text-sm text-[--color-fg]">
            <input type="checkbox" checked={value.includes(option.value)} onChange={() => toggle(option.value)} />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
