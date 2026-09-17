import { NavTabs } from "@/components/ui/NavTabs";
import { PageHeader } from "@/components/ui/PageHeader";

const TABS = [
  { href: "/config/accounts", label: "Accounts" },
  { href: "/config/proxies", label: "Proxies" },
  { href: "/config/policy", label: "Scraping policy" },
  { href: "/config/system", label: "System" },
] as const;

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader
        title="Project config"
        description="LinkedIn credentials, proxies, and pacing — moved here from .env so an admin can manage them without editing files or restarting anything, except where noted on System."
      />
      <NavTabs items={TABS} />
      {children}
    </div>
  );
}
