import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";

export function KeywordsField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label="Keywords">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder="e.g. product manager"
      />
    </Field>
  );
}
