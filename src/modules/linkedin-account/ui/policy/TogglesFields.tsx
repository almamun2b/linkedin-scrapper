import type { ScrapingPolicyModel } from "@/generated/prisma/models/ScrapingPolicy";
import { Checkbox } from "@/components/ui/form/Checkbox";
import { FormSection } from "@/components/ui/form/FormSection";

export function TogglesFields({ policy }: { policy: ScrapingPolicyModel }) {
  return (
    <FormSection title="Toggles">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
        <Checkbox
          name="useProxy"
          defaultChecked={policy.useProxy}
          label="Use proxy"
          hint="Fails the job if none resolvable — never falls back to direct IP"
        />
        <Checkbox name="headless" defaultChecked={policy.headless} label="Headless browser" />
      </div>
    </FormSection>
  );
}
