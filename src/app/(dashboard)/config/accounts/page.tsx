import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import * as proxyRepo from "@/modules/proxy/repository/proxy.repository";
import { getCurrentUser } from "@/modules/auth/service/getCurrentUser";
import { getSystemSetting } from "@/modules/settings/service/getEffectiveSettings";
import { AccountList } from "@/modules/linkedin-account/ui/AccountList";
import { AddAccountButton } from "@/modules/linkedin-account/ui/AddAccountButton";

export default async function AccountsPage() {
  const [accounts, proxies, user, systemSetting] = await Promise.all([
    accountRepo.list(),
    proxyRepo.list(),
    getCurrentUser(),
    getSystemSetting(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{accounts.length} LinkedIn account(s)</p>
        <AddAccountButton defaultTimezone={systemSetting.displayTimezone} proxies={proxies} />
      </div>
      <AccountList accounts={accounts} proxies={proxies} canDelete={user?.role === "ADMIN"} />
    </div>
  );
}
