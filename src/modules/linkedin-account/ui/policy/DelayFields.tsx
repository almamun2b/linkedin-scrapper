import type { ScrapingPolicyModel } from "@/generated/prisma/models/ScrapingPolicy";
import { NumberField } from "./NumberField";

export function DelayFields({ policy }: { policy: ScrapingPolicyModel }) {
  return (
    <fieldset className="rounded-[--radius-card] border border-[--color-border] p-4">
      <legend className="px-1 text-xs font-semibold text-[--color-muted]">Pacing (ms)</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NumberField label="Step delay min" name="stepDelayMinMs" defaultValue={policy.stepDelayMinMs} />
        <NumberField label="Step delay max" name="stepDelayMaxMs" defaultValue={policy.stepDelayMaxMs} />
        <NumberField label="Profile delay min" name="profileDelayMinMs" defaultValue={policy.profileDelayMinMs} />
        <NumberField label="Profile delay max" name="profileDelayMaxMs" defaultValue={policy.profileDelayMaxMs} />
        <NumberField label="Page delay min" name="pageDelayMinMs" defaultValue={policy.pageDelayMinMs} />
        <NumberField label="Page delay max" name="pageDelayMaxMs" defaultValue={policy.pageDelayMaxMs} />
        <NumberField label="Session break after (profiles)" name="sessionBreakAfter" defaultValue={policy.sessionBreakAfter} />
        <NumberField label="Session break min" name="sessionBreakMinMs" defaultValue={policy.sessionBreakMinMs} />
        <NumberField label="Session break max" name="sessionBreakMaxMs" defaultValue={policy.sessionBreakMaxMs} />
      </div>
    </fieldset>
  );
}
