import { randomUUID } from "node:crypto";
import { prisma } from "../prisma";
import { Prisma } from "../../../generated/prisma/client";

export interface ConsumeBudgetResult {
  consumed: number;
}

/**
 * One atomic statement creates the window row on first use *and* atomically decrements on
 * every subsequent call — no separate "ensure window exists" step, no lost-update race.
 * Zero rows back means over budget (ARCHITECTURE.md §9 layer 4). Every identifier quoted
 * per CLAUDE.md invariant #6.
 */
export async function consumeRateBudget(params: {
  scope: string;
  scopeId: string;
  metric: string;
  windowStart: Date;
  windowEnd: Date;
  cap: number;
}): Promise<ConsumeBudgetResult | null> {
  const { scope, scopeId, metric, windowStart, windowEnd, cap } = params;
  const rows = await prisma.$queryRaw<ConsumeBudgetResult[]>(Prisma.sql`
    INSERT INTO "RateBudget"
      ("id", "scope", "scopeId", "metric", "windowStart", "windowEnd", "consumed", "cap", "createdAt", "updatedAt")
    VALUES
      (${randomUUID()}, ${scope}, ${scopeId}, ${metric}::"RateMetric", ${windowStart}, ${windowEnd}, 1, ${cap}, now(), now())
    ON CONFLICT ("scope", "scopeId", "metric", "windowStart")
    DO UPDATE SET "consumed" = "RateBudget"."consumed" + 1, "updatedAt" = now()
    WHERE "RateBudget"."consumed" < "RateBudget"."cap"
    RETURNING "consumed";
  `);
  return rows[0] ?? null;
}
