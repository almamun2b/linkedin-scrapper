import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/service/getCurrentUser";
import { Sidebar } from "./Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[--color-bg]">
      <Sidebar user={user} />
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
