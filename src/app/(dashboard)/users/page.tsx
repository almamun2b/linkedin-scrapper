import { getCurrentUser } from "@/modules/auth/service/getCurrentUser";
import * as userRepo from "@/modules/user/repository/user.repository";
import { UsersTable } from "@/modules/user/ui/UsersTable";
import { AddUserButton } from "@/modules/user/ui/AddUserButton";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function UsersPage() {
  const [me, users] = await Promise.all([getCurrentUser(), userRepo.list()]);
  const canManage = me?.role === "ADMIN";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="People who can sign in to this dashboard — not the LinkedIn accounts the scraper logs in as (see Config)."
        actions={canManage ? <AddUserButton /> : undefined}
      />
      <UsersTable users={users} canManage={canManage} currentUserId={me?.id} />
    </div>
  );
}
