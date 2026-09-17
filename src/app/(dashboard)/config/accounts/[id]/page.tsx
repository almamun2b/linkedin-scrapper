import { notFound } from "next/navigation";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import * as proxyRepo from "@/modules/proxy/repository/proxy.repository";
import { AccountEditForm } from "@/modules/linkedin-account/ui/AccountEditForm";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [account, proxies] = await Promise.all([accountRepo.findById(id), proxyRepo.list()]);
  if (!account) notFound();

  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-foreground">{account.label}</h2>
      <AccountEditForm account={account} proxies={proxies} />
    </div>
  );
}
