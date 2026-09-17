"use client";

import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ALL_NAV_ITEMS } from "./nav";
import { useShell } from "./ShellProvider";

function currentTitle(pathname: string): string {
  const match = ALL_NAV_ITEMS.filter((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Dashboard";
}

export function AppHeader() {
  const { collapsed, toggleCollapsed, openMobile } = useShell();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex h-header shrink-0 items-center gap-3 border-b border-border bg-card px-4">
      <button
        type="button"
        onClick={openMobile}
        aria-label="Open navigation"
        className="flex size-9 items-center justify-center rounded-md text-foreground hover:bg-surface-muted lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
        aria-controls="app-sidebar"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden size-9 items-center justify-center rounded-md text-foreground hover:bg-surface-muted lg:flex"
      >
        {collapsed ? (
          <PanelLeftOpen aria-hidden="true" className="size-5" />
        ) : (
          <PanelLeftClose aria-hidden="true" className="size-5" />
        )}
      </button>

      <h1 className="flex-1 truncate text-sm font-semibold text-foreground">
        {currentTitle(pathname)}
      </h1>

      <ButtonLink href="/searches/new" size="sm">
        New search
      </ButtonLink>
    </header>
  );
}
