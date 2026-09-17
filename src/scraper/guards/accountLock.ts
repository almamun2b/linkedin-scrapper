import { Client } from "pg";
import { env } from "@/server/config/env";
import { logger } from "@/server/logger";
import { err, ok, type Result } from "@/server/result";

const log = logger.child({ module: "accountLock" });

export interface LockUnavailableError {
  kind: "lock_unavailable";
}

/**
 * `pg_try_advisory_lock` is session-scoped, exactly like LISTEN (ARCHITECTURE.md §6.3's
 * reasoning applies here too) — a pooled Prisma connection could hand a later query to a
 * different physical session, silently breaking "one LinkedIn account = at most one live
 * session, process-wide" (CLAUDE.md invariant #2). Uses its own dedicated `pg.Client`
 * instead. Failure to acquire is a `Result` err — the caller pushes the job back, never
 * treats it as an error.
 */
export async function withAccountLock<T>(
  accountId: string,
  fn: () => Promise<T>,
): Promise<Result<T, LockUnavailableError>> {
  const client = new Client({ connectionString: env.DATABASE_URL, options: "-c timezone=UTC" });
  await client.connect();
  try {
    const { rows } = await client.query<{ acquired: boolean }>(
      "SELECT pg_try_advisory_lock(hashtext('li:acct:' || $1)) AS acquired",
      [accountId],
    );
    if (!rows[0]?.acquired) {
      log.info({ accountId }, "account lock unavailable, pushing job back");
      return err({ kind: "lock_unavailable" });
    }
    try {
      const value = await fn();
      return ok(value);
    } finally {
      await client.query("SELECT pg_advisory_unlock(hashtext('li:acct:' || $1))", [accountId]);
    }
  } finally {
    await client.end();
  }
}
