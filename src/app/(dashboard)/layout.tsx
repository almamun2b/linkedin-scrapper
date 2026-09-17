import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/service/getCurrentUser";
import { AppShell } from "@/components/shared/app-shell/AppShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
