"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";
import { NAV_GROUPS } from "./nav";
import { SidebarUserMenu } from "./SidebarUserMenu";
import { useShell } from "./ShellProvider";

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  user,
}: {
  user: { email: string | null; name: string | null; role: Role };
}) {
  const { collapsed, mobileOpen, closeMobile } = useShell();
  const pathname = usePathname();

  const nav = (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {collapsed ? null : (
            <p className="mb-1 px-2.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {group.label}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                      collapsed && "justify-center",
                      active
                        ? "bg-primary-subtle text-primary"
                        : "text-foreground hover:bg-surface-muted",
                    )}
                  >
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary"
                      />
                    ) : null}
                    <item.icon aria-hidden="true" className="size-4.5 shrink-0" />
                    {collapsed ? null : item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div
      className={cn(
        "flex h-header shrink-0 items-center gap-2 border-b border-border px-4",
        collapsed && "justify-center px-2",
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
      >
        in
      </span>
      {collapsed ? null : (
        <span className="truncate text-sm font-semibold text-foreground">LinkedIn Scrapper</span>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: fixed rail/sidebar */}
      <aside
        id="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-card transition-[width] duration-200 lg:flex",
          collapsed ? "w-sidebar-rail" : "w-sidebar",
        )}
      >
        {brand}
        {nav}
        <SidebarUserMenu user={user} />
      </aside>

      {/* Mobile: off-canvas drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMobile}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative flex h-full w-sidebar max-w-[85vw] flex-col bg-card shadow-popover"
          >
            {brand}
            {nav}
            <SidebarUserMenu user={user} />
          </div>
        </div>
      ) : null}
    </>
  );
}
