import { err, ok, type Result } from "@/server/result";
import { consumeRateBudget } from "@/server/db/raw/consumeRateBudget.sql.ts";

export interface QuotaExceededError {
  kind: "quota_exceeded";
  metric: string;
}

/** Charged before navigation, atomically, via server/db/raw (ARCHITECTURE.md §9 layer 4). */
export async function consumeDailyProfileBudget(params: {
  accountId: string;
  cap: number;
  now: Date;
}): Promise<Result<{ consumed: number }, QuotaExceededError>> {
  const { accountId, cap, now } = params;
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const windowEnd = new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);
  const result = await consumeRateBudget({
    scope: "linkedInAccount",
    scopeId: accountId,
    metric: "PROFILES_PER_DAY",
    windowStart,
    windowEnd,
    cap,
  });
  if (!result) {
    return err({ kind: "quota_exceeded", metric: "PROFILES_PER_DAY" });
  }
  return ok(result);
}

export async function consumeSearchPageBudget(params: {
  accountId: string;
  cap: number;
  now: Date;
}): Promise<Result<{ consumed: number }, QuotaExceededError>> {
  const { accountId, cap, now } = params;
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const windowEnd = new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);
  const result = await consumeRateBudget({
    scope: "linkedInAccount",
    scopeId: accountId,
    metric: "SEARCH_PAGES_PER_DAY",
    windowStart,
    windowEnd,
    cap,
  });
  if (!result) {
    return err({ kind: "quota_exceeded", metric: "SEARCH_PAGES_PER_DAY" });
  }
  return ok(result);
}
