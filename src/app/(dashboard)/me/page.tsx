import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/service/getCurrentUser";
import * as userRepo from "@/modules/user/repository/user.repository";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { UpdateMeForm } from "@/modules/user/ui/UpdateMeForm";
import { ChangePasswordForm } from "@/modules/user/ui/ChangePasswordForm";

export default async function MePage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const user = await userRepo.findById(me.id);
  if (!user) redirect("/login");

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader title="My profile" description="Update your own name, email, and password." />

      <Card>
        <CardContent className="flex items-center gap-4">
          <Avatar name={user.name} email={user.email} className="size-14 text-base" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-foreground">
              {user.name ?? user.email}
            </p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <Badge tone="accent">{user.role}</Badge>
            <p className="text-xs text-muted-foreground">
              Member since {user.createdAt.toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <UpdateMeForm email={user.email} name={user.name} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
