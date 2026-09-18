import type { ScrapingPolicySettings } from "../../repository/settings.repository";
import { FormSection } from "@/components/ui/form/FormSection";
import { SCRAPING_POLICY_HELP } from "../../domain/settingsHelp";
import { NumberField } from "./NumberField";

export function DelayFields({ policy }: { policy: ScrapingPolicySettings }) {
  return (
    <FormSection title="Pacing (ms)">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NumberField
          label="Step delay min"
          name="stepDelayMinMs"
          defaultValue={policy.stepDelayMinMs}
          help={SCRAPING_POLICY_HELP.stepDelayMinMs}
        />
        <NumberField
          label="Step delay max"
          name="stepDelayMaxMs"
          defaultValue={policy.stepDelayMaxMs}
          help={SCRAPING_POLICY_HELP.stepDelayMaxMs}
        />
        <NumberField
          label="Profile delay min"
          name="profileDelayMinMs"
          defaultValue={policy.profileDelayMinMs}
          help={SCRAPING_POLICY_HELP.profileDelayMinMs}
        />
        <NumberField
          label="Profile delay max"
          name="profileDelayMaxMs"
          defaultValue={policy.profileDelayMaxMs}
          help={SCRAPING_POLICY_HELP.profileDelayMaxMs}
        />
        <NumberField
          label="Page delay min"
          name="pageDelayMinMs"
          defaultValue={policy.pageDelayMinMs}
          help={SCRAPING_POLICY_HELP.pageDelayMinMs}
        />
        <NumberField
          label="Page delay max"
          name="pageDelayMaxMs"
          defaultValue={policy.pageDelayMaxMs}
          help={SCRAPING_POLICY_HELP.pageDelayMaxMs}
        />
        <NumberField
          label="Session break after (profiles)"
          name="sessionBreakAfter"
          defaultValue={policy.sessionBreakAfter}
          help={SCRAPING_POLICY_HELP.sessionBreakAfter}
        />
        <NumberField
          label="Session break min"
          name="sessionBreakMinMs"
          defaultValue={policy.sessionBreakMinMs}
          help={SCRAPING_POLICY_HELP.sessionBreakMinMs}
        />
        <NumberField
          label="Session break max"
          name="sessionBreakMaxMs"
          defaultValue={policy.sessionBreakMaxMs}
          help={SCRAPING_POLICY_HELP.sessionBreakMaxMs}
        />
      </div>
    </FormSection>
  );
}
