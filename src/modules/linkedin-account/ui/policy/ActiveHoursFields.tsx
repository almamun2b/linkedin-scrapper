import type { ScrapingPolicyModel } from "@/generated/prisma/models/ScrapingPolicy";
import { NumberField } from "./NumberField";

export function ActiveHoursFields({ policy }: { policy: ScrapingPolicyModel }) {
  return (
    <fieldset className="rounded-[--radius-card] border border-[--color-border] p-4">
      <legend className="px-1 text-xs font-semibold text-[--color-muted]">
        Active hours (account-local time — does not yet express an overnight wrap)
      </legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NumberField label="Start hour (0-23)" name="activeHoursStart" defaultValue={policy.activeHoursStart} />
        <NumberField label="End hour (0-23)" name="activeHoursEnd" defaultValue={policy.activeHoursEnd} />
        <label className="flex items-center gap-2 self-end pb-1.5 text-xs text-[--color-muted]">
          <input type="checkbox" name="activeOnWeekends" defaultChecked={policy.activeOnWeekends} />
          Active on weekends
        </label>
      </div>
    </fieldset>
  );
}
