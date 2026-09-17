import Link from "next/link";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import * as policyRepo from "@/modules/linkedin-account/repository/scrapingPolicy.repository";
import { PolicyForm } from "@/modules/linkedin-account/ui/PolicyForm";
import { cn } from "@/ui/cn";

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
      <div className="flex flex-wrap gap-2">
        {accounts.map((account) => (
          <Link
            key={account.id}
            href={`/config/policy?accountId=${account.id}`}
            className={cn(
              "rounded-full border border-[--color-border] px-3 py-1 text-xs",
              account.id === selected ? "bg-[--color-accent] text-white" : "text-[--color-muted]",
            )}
          >
            {account.label}
          </Link>
        ))}
      </div>
      {policy ? (
        <PolicyForm policy={policy} />
      ) : (
        <p className="text-sm text-[--color-muted]">No LinkedIn account yet — add one under Accounts first.</p>
      )}
    </div>
  );
}
