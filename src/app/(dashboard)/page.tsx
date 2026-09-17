import { Briefcase, Cog, ListChecks, Search, Users2 } from "lucide-react";
import { getCurrentUser } from "@/modules/auth/service/getCurrentUser";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import * as leadRepo from "@/modules/lead/repository/lead.repository";
import * as jobsRepo from "@/modules/jobs/repository/jobs.repository";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";

const CARDS = [
  {
    href: "/searches",
    label: "Searches",
    description: "Define filters and start a run",
    icon: Search,
  },
  {
    href: "/runs",
    label: "Runs",
    description: "Track paced collection in progress",
    icon: ListChecks,
  },
  {
    href: "/leads",
    label: "Leads",
    description: "Review scraped and enriched results",
    icon: Users2,
  },
  {
    href: "/jobs",
    label: "Jobs",
    description: "Inspect the queue, retry dead jobs",
    icon: Briefcase,
  },
  {
    href: "/config/accounts",
    label: "LinkedIn accounts",
    description: "Accounts, proxies, and pacing",
    icon: Cog,
  },
] as const;

export default async function OverviewPage() {
  const user = await getCurrentUser();
  const [accountCount, leadCount, deadJobCount] = await Promise.all([
    accountRepo.count(),
    leadRepo.count(),
    jobsRepo.countDead(),
  ]);

  return (
    <div>
      <PageHeader
        title="Overview"
        description={`Signed in as ${user?.email ?? "unknown"} (${user?.role ?? "—"})`}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="LinkedIn accounts" value={accountCount} icon={Cog} />
        <StatCard label="Leads" value={leadCount} icon={Users2} />
        <StatCard
          label="Dead jobs"
          value={deadJobCount}
          icon={Briefcase}
          tone={deadJobCount > 0 ? "danger" : undefined}
          href="/jobs?status=DEAD"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="h-full transition-colors hover:bg-surface-muted">
              <CardContent className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary">
                  <card.icon aria-hidden="true" className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{card.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
