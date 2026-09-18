import type { ReactNode } from "react";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";

export function NumberField({
  label,
  name,
  defaultValue,
  help,
}: {
  label: string;
  name: string;
  defaultValue: number;
  help?: ReactNode;
}) {
  return (
    <Field label={label} help={help}>
      <Input type="number" name={name} defaultValue={defaultValue} />
    </Field>
  );
}
