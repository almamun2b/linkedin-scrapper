import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";
import { SignOutButton } from "./SignOutButton";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/searches", label: "Searches" },
  { href: "/runs", label: "Runs" },
  { href: "/leads", label: "Leads" },
  { href: "/jobs", label: "Jobs" },
  { href: "/config/accounts", label: "Config" },
  { href: "/users", label: "Users" },
] as const;

export function Sidebar({ user }: { user: { email?: string | null; role: Role } }) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[--color-border] bg-[--color-surface] px-4 py-6">
      <div className="mb-6 px-2 text-sm font-semibold text-[--color-fg]">LinkedIn Scrapper</div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-2 py-1.5 text-sm text-[--color-fg] hover:bg-[--color-bg]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6 border-t border-[--color-border] pt-4 text-xs text-[--color-muted]">
        <p className="truncate">{user.email}</p>
        <p className="mb-2">{user.role}</p>
        <SignOutButton />
      </div>
    </aside>
  );
}
