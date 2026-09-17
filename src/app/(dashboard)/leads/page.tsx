import * as leadRepo from "@/modules/lead/repository/lead.repository";
import { LeadsFilterBar } from "@/modules/lead/ui/LeadsFilterBar";
import { LeadsTable } from "@/modules/lead/ui/LeadsTable";
import type { LeadStage } from "@/generated/prisma/enums";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; hasEmail?: string; company?: string }>;
}) {
  const { stage, hasEmail, company } = await searchParams;
  const leads = await leadRepo.list({
    stage: stage ? (stage as LeadStage) : undefined,
    hasEmail: hasEmail === "true",
    companyContains: company === "" ? undefined : company,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Leads"
        description="Name, website, and email extracted from scraped profiles."
      />
      <LeadsFilterBar stage={stage} hasEmail={hasEmail} company={company} />
      <LeadsTable leads={leads} />
    </div>
  );
}
