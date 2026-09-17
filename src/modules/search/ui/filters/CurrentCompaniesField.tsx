import { FilterRefKind } from "@/generated/prisma/enums";
import type { FilterRefValue } from "../../domain/filters";
import { TypeaheadPicker } from "../TypeaheadPicker";

export function CurrentCompaniesField({
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
      kind={FilterRefKind.COMPANY}
      label="Current companies"
      linkedInAccountId={linkedInAccountId}
      values={values}
      onChange={onChange}
    />
  );
}
