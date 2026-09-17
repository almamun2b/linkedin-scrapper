import Link from "next/link";

const TABS = [
  { href: "/config/accounts", label: "Accounts" },
  { href: "/config/proxies", label: "Proxies" },
  { href: "/config/policy", label: "Scraping policy" },
  { href: "/config/system", label: "System" },
] as const;

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-[--color-fg]">Project config</h1>
      <p className="mb-4 text-sm text-[--color-muted]">
        LinkedIn credentials, proxies, and pacing — moved here from .env so an admin can manage
        them without editing files or restarting anything, except where noted on System.
      </p>
      <nav className="mb-6 flex gap-1 border-b border-[--color-border]">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-t-md px-3 py-2 text-sm text-[--color-muted] hover:bg-[--color-surface] hover:text-[--color-fg]"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
