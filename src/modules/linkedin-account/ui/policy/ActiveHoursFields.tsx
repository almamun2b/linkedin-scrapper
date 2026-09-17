import type { ScrapingPolicyModel } from "@/generated/prisma/models/ScrapingPolicy";
import { Checkbox } from "@/components/ui/form/Checkbox";
import { FormSection } from "@/components/ui/form/FormSection";
import { NumberField } from "./NumberField";

export function ActiveHoursFields({ policy }: { policy: ScrapingPolicyModel }) {
  return (
    <FormSection
      title="Active hours"
      description="Account-local time — does not yet express an overnight wrap."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NumberField
          label="Start hour (0-23)"
          name="activeHoursStart"
          defaultValue={policy.activeHoursStart}
        />
        <NumberField
          label="End hour (0-23)"
          name="activeHoursEnd"
          defaultValue={policy.activeHoursEnd}
        />
        <div className="flex items-end pb-1.5">
          <Checkbox
            name="activeOnWeekends"
            defaultChecked={policy.activeOnWeekends}
            label="Active on weekends"
          />
        </div>
      </div>
    </FormSection>
  );
}
