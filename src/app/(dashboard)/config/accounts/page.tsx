import { Plus } from "lucide-react";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import { AccountList } from "@/modules/linkedin-account/ui/AccountList";
import { ButtonLink } from "@/components/ui/ButtonLink";

export default async function AccountsPage() {
  const accounts = await accountRepo.list();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{accounts.length} LinkedIn account(s)</p>
        <ButtonLink href="/config/accounts/new" size="sm">
          <Plus aria-hidden="true" className="size-4" />
          Add account
        </ButtonLink>
      </div>
      <AccountList accounts={accounts} />
    </div>
  );
}
