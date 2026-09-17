import { prisma } from "@/server/db/prisma";
import type { FilterRefKind } from "@/generated/prisma/enums";

/** Instant, DB-only autocomplete — never a live LinkedIn call (invariant #1). */
export async function searchCached(kind: FilterRefKind, query: string, limit = 10) {
  return prisma.filterRef.findMany({
    where: { kind, label: { contains: query, mode: "insensitive" } },
    orderBy: { lastUsedAt: "desc" },
    take: limit,
  });
}

export async function upsertMany(kind: FilterRefKind, pairs: Array<{ label: string; urn: string }>) {
  if (pairs.length === 0) return;
  await prisma.filterRef.createMany({
    data: pairs.map((p) => ({ kind, label: p.label, urn: p.urn })),
    skipDuplicates: true,
  });
}

export async function touchLastUsed(kind: FilterRefKind, urn: string) {
  await prisma.filterRef.updateMany({ where: { kind, urn }, data: { lastUsedAt: new Date() } });
}
