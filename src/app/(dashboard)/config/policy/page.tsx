import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import * as policyRepo from "@/modules/linkedin-account/repository/scrapingPolicy.repository";
import { PolicyForm } from "@/modules/linkedin-account/ui/PolicyForm";
import { Alert } from "@/components/ui/Alert";
import { FilterChips } from "@/components/ui/FilterChips";

export default async function PolicyPage({
  searchParams,
}: {
  searchParams: Promise<{ accountId?: string }>;
}) {
  const { accountId } = await searchParams;
  const accounts = await accountRepo.list();
  const selected = accountId ?? accounts[0]?.id;
  const policy = selected ? await policyRepo.findByAccountId(selected) : null;

  return (
    <div className="flex flex-col gap-4">
      <FilterChips
        items={accounts.map((account) => ({
          key: account.id,
          label: account.label,
          href: `/config/policy?accountId=${account.id}`,
          active: account.id === selected,
        }))}
      />
      {policy ? (
        <PolicyForm policy={policy} />
      ) : (
        <Alert tone="info">No LinkedIn account yet — add one under Accounts first.</Alert>
      )}
    </div>
  );
}
