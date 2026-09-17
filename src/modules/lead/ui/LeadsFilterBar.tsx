import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/form/Checkbox";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { Select } from "@/components/ui/form/Select";

export function LeadsFilterBar({
  stage,
  hasEmail,
  company,
}: {
  stage?: string;
  hasEmail?: string;
  company?: string;
}) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3 shadow-card"
    >
      <Field label="Stage" className="w-36">
        <Select name="stage" defaultValue={stage ?? ""}>
          <option value="">Any</option>
          <option value="STUB">Stub</option>
          <option value="SCRAPED">Scraped</option>
          <option value="ENRICHED">Enriched</option>
          <option value="FAILED">Failed</option>
        </Select>
      </Field>
      <Field label="Company contains" className="w-48">
        <Input name="company" defaultValue={company ?? ""} />
      </Field>
      <div className="pb-1.5">
        <Checkbox
          name="hasEmail"
          value="true"
          defaultChecked={hasEmail === "true"}
          label="Has email only"
        />
      </div>
      <Button type="submit" variant="secondary" size="sm">
        Filter
      </Button>
    </form>
  );
}
