import type { ScrapingPolicySettings } from "../../repository/settings.repository";
import { FormSection } from "@/components/ui/form/FormSection";
import { SCRAPING_POLICY_HELP } from "../../domain/settingsHelp";
import { NumberField } from "./NumberField";

export function QuotaFields({ policy }: { policy: ScrapingPolicySettings }) {
  return (
    <FormSection title="Quotas">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NumberField
          label="Max profiles / day"
          name="maxProfilesPerDay"
          defaultValue={policy.maxProfilesPerDay}
          help={SCRAPING_POLICY_HELP.maxProfilesPerDay}
        />
        <NumberField
          label="Max search pages / day"
          name="maxSearchPagesPerDay"
          defaultValue={policy.maxSearchPagesPerDay}
          help={SCRAPING_POLICY_HELP.maxSearchPagesPerDay}
        />
        <NumberField
          label="Max profiles / week"
          name="maxProfilesPerWeek"
          defaultValue={policy.maxProfilesPerWeek}
          help={SCRAPING_POLICY_HELP.maxProfilesPerWeek}
        />
      </div>
    </FormSection>
  );
}
