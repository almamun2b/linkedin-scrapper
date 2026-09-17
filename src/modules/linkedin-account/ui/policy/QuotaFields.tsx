import type { ScrapingPolicyModel } from "@/generated/prisma/models/ScrapingPolicy";
import { NumberField } from "./NumberField";

export function QuotaFields({ policy }: { policy: ScrapingPolicyModel }) {
  return (
    <fieldset className="rounded-[--radius-card] border border-[--color-border] p-4">
      <legend className="px-1 text-xs font-semibold text-[--color-muted]">Quotas</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <NumberField label="Max profiles / day" name="maxProfilesPerDay" defaultValue={policy.maxProfilesPerDay} />
        <NumberField label="Max search pages / day" name="maxSearchPagesPerDay" defaultValue={policy.maxSearchPagesPerDay} />
        <NumberField label="Max profiles / week" name="maxProfilesPerWeek" defaultValue={policy.maxProfilesPerWeek} />
      </div>
    </fieldset>
  );
}
