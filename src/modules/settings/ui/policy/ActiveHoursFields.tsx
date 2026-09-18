import type { ScrapingPolicySettings } from "../../repository/settings.repository";
import { Checkbox } from "@/components/ui/form/Checkbox";
import { FormSection } from "@/components/ui/form/FormSection";
import { SCRAPING_POLICY_HELP } from "../../domain/settingsHelp";
import { NumberField } from "./NumberField";

export function ActiveHoursFields({ policy }: { policy: ScrapingPolicySettings }) {
  return (
    <FormSection
      title="Active hours"
      description="Evaluated in each account's own timezone — not the server's. Does not yet express an overnight wrap."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NumberField
          label="Start hour (0-23)"
          name="activeHoursStart"
          defaultValue={policy.activeHoursStart}
          help={SCRAPING_POLICY_HELP.activeHoursStart}
        />
        <NumberField
          label="End hour (0-23)"
          name="activeHoursEnd"
          defaultValue={policy.activeHoursEnd}
          help={SCRAPING_POLICY_HELP.activeHoursEnd}
        />
        <div className="flex items-end pb-1.5">
          <Checkbox
            name="activeOnWeekends"
            defaultChecked={policy.activeOnWeekends}
            label="Active on weekends"
            help={SCRAPING_POLICY_HELP.activeOnWeekends}
          />
        </div>
      </div>
    </FormSection>
  );
}
