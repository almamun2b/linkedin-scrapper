import type { ScrapingPolicyModel } from "@/generated/prisma/models/ScrapingPolicy";
import { FormSection } from "@/components/ui/form/FormSection";
import { NumberField } from "./NumberField";

export function DelayFields({ policy }: { policy: ScrapingPolicyModel }) {
  return (
    <FormSection title="Pacing (ms)">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NumberField
          label="Step delay min"
          name="stepDelayMinMs"
          defaultValue={policy.stepDelayMinMs}
        />
        <NumberField
          label="Step delay max"
          name="stepDelayMaxMs"
          defaultValue={policy.stepDelayMaxMs}
        />
        <NumberField
          label="Profile delay min"
          name="profileDelayMinMs"
          defaultValue={policy.profileDelayMinMs}
        />
        <NumberField
          label="Profile delay max"
          name="profileDelayMaxMs"
          defaultValue={policy.profileDelayMaxMs}
        />
        <NumberField
          label="Page delay min"
          name="pageDelayMinMs"
          defaultValue={policy.pageDelayMinMs}
        />
        <NumberField
          label="Page delay max"
          name="pageDelayMaxMs"
          defaultValue={policy.pageDelayMaxMs}
        />
        <NumberField
          label="Session break after (profiles)"
          name="sessionBreakAfter"
          defaultValue={policy.sessionBreakAfter}
        />
        <NumberField
          label="Session break min"
          name="sessionBreakMinMs"
          defaultValue={policy.sessionBreakMinMs}
        />
        <NumberField
          label="Session break max"
          name="sessionBreakMaxMs"
          defaultValue={policy.sessionBreakMaxMs}
        />
      </div>
    </FormSection>
  );
}
