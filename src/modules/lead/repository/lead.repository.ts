import { prisma } from "@/server/db/prisma";
import { LeadStage, type EmailSource } from "@/generated/prisma/enums";

export interface UpsertStubInput {
  publicIdentifier: string;
  profileUrl: string;
  fullName?: string | null;
  headline?: string | null;
  location?: string | null;
  firstSeenRunId?: string | null;
}

/** The natural key is publicIdentifier (the vanity slug); memberUrn is captured alongside as
 * the stable identity once known, but is never itself the upsert key (not always available
 * from a bare search-result stub). */
export async function upsertStub(input: UpsertStubInput) {
  return prisma.lead.upsert({
    where: { publicIdentifier: input.publicIdentifier },
    create: {
      publicIdentifier: input.publicIdentifier,
      profileUrl: input.profileUrl,
      fullName: input.fullName,
      headline: input.headline,
      location: input.location,
      firstSeenRunId: input.firstSeenRunId,
    },
    update: {
      fullName: input.fullName ?? undefined,
      headline: input.headline ?? undefined,
      location: input.location ?? undefined,
    },
  });
}

export async function findByPublicIdentifier(publicIdentifier: string) {
  return prisma.lead.findUnique({ where: { publicIdentifier } });
}

export interface RecordScrapeInput {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  headline?: string | null;
  location?: string | null;
  currentTitle?: string | null;
  currentCompany?: string | null;
  email?: string | null;
  emailSource?: EmailSource | null;
  emailConfidence?: number | null;
  websiteUrl?: string | null;
  memberUrn?: string | null;
}

export async function recordScrape(publicIdentifier: string, data: RecordScrapeInput) {
  return prisma.lead.update({
    where: { publicIdentifier },
    data: { ...data, stage: LeadStage.SCRAPED, scrapedAt: new Date(), lastScrapedAt: new Date() },
  });
}

export async function attachToRun(runId: string, leadId: string, page: number, position: number) {
  return prisma.runLead.upsert({
    where: { runId_leadId: { runId, leadId } },
    create: { runId, leadId, page, position },
    update: {},
  });
}

export async function count() {
  return prisma.lead.count();
}

export interface ListParams {
  stage?: LeadStage;
  hasEmail?: boolean;
  companyContains?: string;
  take?: number;
  skip?: number;
}

export async function list(params: ListParams) {
  return prisma.lead.findMany({
    where: {
      stage: params.stage,
      email: params.hasEmail ? { not: null } : undefined,
      currentCompany: params.companyContains ? { contains: params.companyContains, mode: "insensitive" } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: params.take ?? 50,
    skip: params.skip ?? 0,
  });
}
