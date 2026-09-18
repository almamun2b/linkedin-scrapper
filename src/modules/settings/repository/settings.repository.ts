import { prisma } from "@/server/db/prisma";

const SINGLETON_ID = "global";

/** Both singletons are guaranteed to exist by `prisma/seed.ts` and by the migration that
 * created them — `findUniqueOrThrow` is deliberate: a missing row here is a deployment bug,
 * not a business case any caller should have to handle. */
export async function getScrapingPolicy() {
  return prisma.scrapingPolicy.findUniqueOrThrow({ where: { id: SINGLETON_ID } });
}

/** The `omit`-shaped type (no `fallbackProxyUrlSealed`) — what every UI component that
 * reads via `getScrapingPolicy` actually receives, distinct from the full generated
 * `ScrapingPolicyModel` type which assumes every column present (same pattern as
 * `LinkedInAccountListItem` in linkedInAccount.repository.ts). */
export type ScrapingPolicySettings = Awaited<ReturnType<typeof getScrapingPolicy>>;

export interface UpdateScrapingPolicyPatch {
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
  proxyCountry: string | null;
}

export async function updateScrapingPolicy(patch: UpdateScrapingPolicyPatch) {
  return prisma.scrapingPolicy.update({ where: { id: SINGLETON_ID }, data: patch });
}

export async function updateFallbackProxyUrl(sealed: Uint8Array<ArrayBuffer>, keyVer: number) {
  return prisma.scrapingPolicy.update({
    where: { id: SINGLETON_ID },
    data: { fallbackProxyUrlSealed: sealed, fallbackProxyUrlKeyVer: keyVer },
  });
}

/** Worker-only: opts back into the sealed fallback proxy URL, mirroring
 * `linkedInAccount.repository.ts`'s `findForWorker` pattern. */
export async function getScrapingPolicyForWorker() {
  return prisma.scrapingPolicy.findUniqueOrThrow({
    where: { id: SINGLETON_ID },
    omit: { fallbackProxyUrlSealed: false },
  });
}

export async function getSystemSetting() {
  return prisma.systemSetting.findUniqueOrThrow({ where: { id: SINGLETON_ID } });
}

export interface UpdateSystemSettingPatch {
  workerId: string;
  workerConcurrency: number;
  workerQueues: string;
  pollIntervalMs: number;
  leaseSeconds: number;
  leaseHeartbeatMs: number;
  shutdownGraceMs: number;
  logLevel: string;
  displayTimezone: string;
}

export async function updateSystemSetting(patch: UpdateSystemSettingPatch) {
  return prisma.systemSetting.update({ where: { id: SINGLETON_ID }, data: patch });
}
