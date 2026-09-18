import { prisma } from "@/server/db/prisma";
import { AccountStatus } from "../../../generated/prisma/enums";
import type { AccountFingerprint } from "../domain/fingerprint";

export interface CreateAccountInput {
  email: string;
  label: string;
  passwordSealed: Uint8Array<ArrayBuffer>;
  fingerprint: AccountFingerprint;
  proxyId?: string | null;
}

/** Web-safe: sealed columns stay excluded via the client-level `omit` in server/db/prisma.ts. */
export async function findByEmail(email: string) {
  return prisma.linkedInAccount.findUnique({ where: { email } });
}

export async function findById(id: string) {
  return prisma.linkedInAccount.findUnique({ where: { id } });
}

/** Web-safe list for the /config UI — sealed columns stay excluded via the client-level
 * `omit`. Includes searches/runs counts so the delete confirmation can show real numbers
 * instead of a generic warning, without a second round trip per row. */
export async function list() {
  return prisma.linkedInAccount.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { searchDefinitions: true, scrapeRuns: true } } },
  });
}

/** The `omit`-shaped type (no passwordSealed/storageStateSealed) — what every UI component
 * that reads via `list`/`findById` actually receives, distinct from the full generated
 * `LinkedInAccountModel` type which assumes every column present. */
export type LinkedInAccountListItem = Awaited<ReturnType<typeof list>>[number];
export type LinkedInAccountDetail = NonNullable<Awaited<ReturnType<typeof findById>>>;

export async function count() {
  return prisma.linkedInAccount.count();
}

export interface UpdateMetaInput {
  label?: string;
  timezone?: string;
  proxyId?: string | null;
}

export async function updateMeta(id: string, patch: UpdateMetaInput) {
  return prisma.linkedInAccount.update({ where: { id }, data: patch });
}

/** Worker-only — the one sanctioned place that opts back into the sealed columns. */
export async function findForWorker(id: string) {
  return prisma.linkedInAccount.findUnique({
    where: { id },
    omit: { passwordSealed: false, storageStateSealed: false },
  });
}

export async function create(input: CreateAccountInput) {
  return prisma.linkedInAccount.create({
    data: {
      email: input.email,
      label: input.label,
      passwordSealed: input.passwordSealed,
      fingerprint: input.fingerprint,
      proxyId: input.proxyId ?? null,
      status: AccountStatus.UNVERIFIED,
    },
  });
}

export async function updateStatus(id: string, status: AccountStatus, statusReason?: string) {
  return prisma.linkedInAccount.update({
    where: { id },
    data: { status, statusReason: statusReason ?? null },
  });
}

export async function updatePasswordSealed(
  id: string,
  sealed: Uint8Array<ArrayBuffer>,
  keyVer: number,
) {
  return prisma.linkedInAccount.update({
    where: { id },
    data: { passwordSealed: sealed, passwordKeyVer: keyVer },
  });
}

export async function updateFingerprint(id: string, fingerprint: AccountFingerprint) {
  return prisma.linkedInAccount.update({ where: { id }, data: { fingerprint } });
}

export async function updateStorageState(
  id: string,
  sealed: Uint8Array<ArrayBuffer>,
  keyVer: number,
) {
  return prisma.linkedInAccount.update({
    where: { id },
    data: { storageStateSealed: sealed, storageStateKeyVer: keyVer, storageStateAt: new Date() },
  });
}

export async function updateLastLogin(id: string) {
  return prisma.linkedInAccount.update({ where: { id }, data: { lastLoginAt: new Date() } });
}

export async function updateLastActivity(id: string) {
  return prisma.linkedInAccount.update({ where: { id }, data: { lastActivityAt: new Date() } });
}

/**
 * Hard delete. ScrapingPolicy cascades, SearchDefinition/ScrapeRun cascade (their RunLead
 * join rows go with them; Lead/LeadSnapshot/Job rows detach via SetNull and survive).
 * Job rows detach (SetNull); QUEUED jobs are cancelled and RateBudgets removed by the
 * service before this runs.
 */
export async function remove(id: string) {
  return prisma.linkedInAccount.delete({ where: { id } });
}
