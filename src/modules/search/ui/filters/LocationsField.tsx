import { FilterRefKind } from "@/generated/prisma/enums";
import type { FilterRefValue } from "../../domain/filters";
import { TypeaheadPicker } from "../TypeaheadPicker";

export function LocationsField({
  linkedInAccountId,
  values,
  onChange,
}: {
  linkedInAccountId: string;
  values: FilterRefValue[];
  onChange: (values: FilterRefValue[]) => void;
}) {
  return (
    <TypeaheadPicker
      kind={FilterRefKind.GEO}
      label="Locations"
      linkedInAccountId={linkedInAccountId}
      values={values}
      onChange={onChange}
    />
  );
}
