import { getScrapingPolicy } from "@/modules/settings/service/getEffectiveSettings";
import { ScrapingPolicyForm } from "@/modules/settings/ui/ScrapingPolicyForm";

export default async function PolicyPage() {
  const policy = await getScrapingPolicy();

  return (
    <div className="max-w-3xl">
      <ScrapingPolicyForm policy={policy} />
    </div>
  );
}
