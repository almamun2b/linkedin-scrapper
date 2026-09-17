import { prisma } from "@/server/db/prisma";
import { RunStatus } from "@/generated/prisma/enums";

export interface CreateRunInput {
  searchDefinitionId: string;
  linkedInAccountId: string;
  filtersSnapshot: unknown;
  searchUrl: string;
  maxPages: number;
}

export async function create(input: CreateRunInput) {
  return prisma.scrapeRun.create({
    data: {
      searchDefinitionId: input.searchDefinitionId,
      linkedInAccountId: input.linkedInAccountId,
      filtersSnapshot: input.filtersSnapshot as never,
      searchUrl: input.searchUrl,
      maxPages: input.maxPages,
    },
  });
}

export async function findById(id: string) {
  return prisma.scrapeRun.findUnique({ where: { id } });
}

export async function list(params: { status?: RunStatus; take?: number; skip?: number }) {
  return prisma.scrapeRun.findMany({
    where: params.status ? { status: params.status } : undefined,
    orderBy: { createdAt: "desc" },
    take: params.take ?? 50,
    skip: params.skip ?? 0,
  });
}

export async function requestCancel(id: string) {
  return prisma.scrapeRun.update({ where: { id }, data: { cancelRequestedAt: new Date() } });
}

export async function markRunning(id: string) {
  return prisma.scrapeRun.update({ where: { id }, data: { status: RunStatus.RUNNING, startedAt: new Date() } });
}

export async function incrementCounters(
  id: string,
  delta: Partial<{ pagesDone: number; profilesDone: number; leadsNew: number; emailsFound: number }>,
) {
  return prisma.scrapeRun.update({
    where: { id },
    data: {
      pagesDone: delta.pagesDone ? { increment: delta.pagesDone } : undefined,
      profilesDone: delta.profilesDone ? { increment: delta.profilesDone } : undefined,
      leadsNew: delta.leadsNew ? { increment: delta.leadsNew } : undefined,
      emailsFound: delta.emailsFound ? { increment: delta.emailsFound } : undefined,
    },
  });
}

export async function finalize(id: string, status: RunStatus, haltReason?: string) {
  return prisma.scrapeRun.update({
    where: { id },
    data: { status, finishedAt: new Date(), haltReason: haltReason ?? null },
  });
}
