import Link from "next/link";
import { getCurrentUser } from "@/modules/auth/service/getCurrentUser";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import * as leadRepo from "@/modules/lead/repository/lead.repository";
import * as jobsRepo from "@/modules/jobs/repository/jobs.repository";

const CARDS = [
  { href: "/searches", label: "Searches" },
  { href: "/runs", label: "Runs" },
  { href: "/leads", label: "Leads" },
  { href: "/jobs", label: "Jobs" },
  { href: "/config/accounts", label: "LinkedIn accounts" },
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
      <h1 className="mb-1 text-lg font-semibold text-[--color-fg]">Overview</h1>
      <p className="mb-6 text-sm text-[--color-muted]">Signed in as {user?.email} ({user?.role})</p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="LinkedIn accounts" value={accountCount} />
        <Stat label="Leads" value={leadCount} />
        <Stat label="Dead jobs" value={deadJobCount} tone={deadJobCount > 0 ? "danger" : undefined} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-[--radius-card] border border-[--color-border] bg-[--color-surface] px-4 py-3 text-sm font-medium text-[--color-fg] hover:bg-[--color-bg]"
          >
            {card.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "danger" }) {
  return (
    <div className="rounded-[--radius-card] border border-[--color-border] bg-[--color-surface] p-4">
      <p className="text-xs text-[--color-muted]">{label}</p>
      <p className={`text-2xl font-semibold ${tone === "danger" ? "text-[--color-danger]" : "text-[--color-fg]"}`}>
        {value}
      </p>
    </div>
  );
}
