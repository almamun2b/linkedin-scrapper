import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";

export function NumberField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number;
}) {
  return (
    <Field label={label}>
      <Input type="number" name={name} defaultValue={defaultValue} />
    </Field>
  );
}
