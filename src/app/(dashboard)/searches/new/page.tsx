import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import { SearchFilterForm } from "@/modules/search/ui/SearchFilterForm";

export default async function NewSearchPage() {
  const accounts = await accountRepo.list();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-[--color-fg]">New search</h1>
      {accounts.length === 0 ? (
        <p className="text-sm text-[--color-muted]">Add a LinkedIn account under Config first.</p>
      ) : (
        <SearchFilterForm accounts={accounts} />
      )}
    </div>
  );
}
