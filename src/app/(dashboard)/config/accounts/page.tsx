import Link from "next/link";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import { AccountList } from "@/modules/linkedin-account/ui/AccountList";

export default async function AccountsPage() {
  const accounts = await accountRepo.list();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[--color-muted]">{accounts.length} LinkedIn account(s)</p>
        <Link href="/config/accounts/new" className="text-sm text-[--color-accent] hover:underline">
          + Add account
        </Link>
      </div>
      <AccountList accounts={accounts} />
    </div>
  );
}
