import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import { SearchFilterForm } from "@/modules/search/ui/SearchFilterForm";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function NewSearchPage() {
  const accounts = await accountRepo.list();

  return (
    <div>
      <PageHeader title="New search" />
      {accounts.length === 0 ? (
        <Alert tone="info">Add a LinkedIn account under Config first.</Alert>
      ) : (
        <SearchFilterForm accounts={accounts} />
      )}
    </div>
  );
}
