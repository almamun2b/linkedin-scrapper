import { Briefcase, Cog, LayoutDashboard, ListChecks, Search, Users, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Grouped sidebar nav. `href` doubles as the active-match prefix (an exact `/` match, and a
 * `startsWith` match for everything else) — see `isNavItemActive` in Sidebar.tsx. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/searches", label: "Searches", icon: Search },
      { href: "/runs", label: "Runs", icon: ListChecks },
      { href: "/leads", label: "Leads", icon: Users2 },
      { href: "/jobs", label: "Jobs", icon: Briefcase },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/config/accounts", label: "Config", icon: Cog },
      { href: "/users", label: "Users", icon: Users },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);
