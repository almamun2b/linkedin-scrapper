import { getCurrentUser } from "@/modules/auth/service/getCurrentUser";
import * as userRepo from "@/modules/user/repository/user.repository";
import { UsersTable } from "@/modules/user/ui/UsersTable";
import { CreateUserForm } from "@/modules/user/ui/CreateUserForm";

export default async function UsersPage() {
  const [me, users] = await Promise.all([getCurrentUser(), userRepo.list()]);
  const canManage = me?.role === "ADMIN";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-[--color-fg]">Users</h1>
        <p className="text-sm text-[--color-muted]">
          People who can sign in to this dashboard. Not to be confused with the LinkedIn accounts the
          scraper logs in as — see Config.
        </p>
      </div>
      {canManage ? <CreateUserForm /> : null}
      <UsersTable users={users} canManage={canManage} />
    </div>
  );
}
