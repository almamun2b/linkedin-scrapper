import { prisma } from "@/server/db/prisma";

/** Bare create — lets every Prisma column default fill in the vetted pacing numbers. */
export async function upsertDefaultForAccount(linkedInAccountId: string) {
  return prisma.scrapingPolicy.upsert({
    where: { linkedInAccountId },
    create: { linkedInAccountId },
    update: {},
  });
}

export async function findByAccountId(linkedInAccountId: string) {
  return prisma.scrapingPolicy.findUnique({ where: { linkedInAccountId } });
}

export interface UpdatePolicyPatch {
  stepDelayMinMs: number;
  stepDelayMaxMs: number;
  profileDelayMinMs: number;
  profileDelayMaxMs: number;
  pageDelayMinMs: number;
  pageDelayMaxMs: number;
  sessionBreakAfter: number;
  sessionBreakMinMs: number;
  sessionBreakMaxMs: number;
  maxProfilesPerDay: number;
  maxSearchPagesPerDay: number;
  maxProfilesPerWeek: number;
  activeHoursStart: number;
  activeHoursEnd: number;
  activeOnWeekends: boolean;
  useProxy: boolean;
  headless: boolean;
}

export async function update(linkedInAccountId: string, patch: UpdatePolicyPatch) {
  return prisma.scrapingPolicy.update({ where: { linkedInAccountId }, data: patch });
}
