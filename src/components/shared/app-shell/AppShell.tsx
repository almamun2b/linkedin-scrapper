"use client";

import type { ReactNode } from "react";
import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";
import { ShellProvider, useShell } from "./ShellProvider";
import { Sidebar } from "./Sidebar";
import { AppHeader } from "./AppHeader";

function AppShellContent({
  user,
  children,
}: {
  user: { email: string | null; name: string | null; role: Role };
  children: ReactNode;
}) {
  const { collapsed } = useShell();
  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user} />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-200 lg:ml-sidebar",
          collapsed && "lg:ml-sidebar-rail",
        )}
      >
        <AppHeader />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: { email: string | null; name: string | null; role: Role };
  children: ReactNode;
}) {
  return (
    <ShellProvider>
      <AppShellContent user={user}>{children}</AppShellContent>
    </ShellProvider>
  );
}
