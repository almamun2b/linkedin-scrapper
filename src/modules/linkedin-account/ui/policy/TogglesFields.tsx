import type { ScrapingPolicyModel } from "@/generated/prisma/models/ScrapingPolicy";

export function TogglesFields({ policy }: { policy: ScrapingPolicyModel }) {
  return (
    <fieldset className="flex gap-6 rounded-[--radius-card] border border-[--color-border] p-4">
      <legend className="px-1 text-xs font-semibold text-[--color-muted]">Toggles</legend>
      <label className="flex items-center gap-2 text-xs text-[--color-muted]">
        <input type="checkbox" name="useProxy" defaultChecked={policy.useProxy} />
        Use proxy (fails the job if none resolvable — never falls back to direct IP)
      </label>
      <label className="flex items-center gap-2 text-xs text-[--color-muted]">
        <input type="checkbox" name="headless" defaultChecked={policy.headless} />
        Headless browser
      </label>
    </fieldset>
  );
}
