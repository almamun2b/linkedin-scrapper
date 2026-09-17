import type { ScrapingPolicyModel } from "@/generated/prisma/models/ScrapingPolicy";
import { FormSection } from "@/components/ui/form/FormSection";
import { NumberField } from "./NumberField";

export function QuotaFields({ policy }: { policy: ScrapingPolicyModel }) {
  return (
    <FormSection title="Quotas">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NumberField
          label="Max profiles / day"
          name="maxProfilesPerDay"
          defaultValue={policy.maxProfilesPerDay}
        />
        <NumberField
          label="Max search pages / day"
          name="maxSearchPagesPerDay"
          defaultValue={policy.maxSearchPagesPerDay}
        />
        <NumberField
          label="Max profiles / week"
          name="maxProfilesPerWeek"
          defaultValue={policy.maxProfilesPerWeek}
        />
      </div>
    </FormSection>
  );
}
