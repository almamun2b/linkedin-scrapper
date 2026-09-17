import { Client } from "pg";
import { env } from "@/server/config/env";
import { logger } from "@/server/logger";
import { prisma } from "@/server/db/prisma";
import { reapExpiredLeases } from "@/modules/jobs/service/queue.service";

const log = logger.child({ module: "scheduler" });
const TICK_MS = 30_000;
const LOCK_NAME = "scheduler:tick";

/**
 * Reaper-only for this pass — cron SearchDefinition evaluation, RateBudget window rollover,
 * and cooldownUntil clearing are deferred to ARCHITECTURE.md §13 stage 5: no rows exist yet
 * to verify that logic against, so it would ship untested. Never auto-reactivates a
 * RESTRICTED account (there is no code path here that touches AccountStatus at all).
 */
async function tick(client: Client): Promise<void> {
  const { rows } = await client.query<{ acquired: boolean }>(
    "SELECT pg_try_advisory_lock(hashtext($1)) AS acquired",
    [LOCK_NAME],
  );
  if (!rows[0]?.acquired) {
    log.debug("scheduler lock held by another instance, skipping tick");
    return;
  }
  try {
    const reaped = await reapExpiredLeases();
    if (reaped > 0) {
      log.info({ reaped }, "reaped expired leases");
    }
    // TODO(stage 5): cron SearchDefinition evaluation, RateBudget window rollover,
    // cooldownUntil clearing, JobLog/AuditEvent pruning.
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext($1))", [LOCK_NAME]);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  log.info("scheduler started");

  const runOnce = process.argv.includes("--once");
  if (runOnce) {
    await tick(client);
    await client.end();
    await prisma.$disconnect();
    process.exit(0);
  }

  let running = true;
  process.once("SIGTERM", () => {
    running = false;
  });
  process.once("SIGINT", () => {
    running = false;
  });

  // `running` is flipped to false only inside the SIGTERM/SIGINT handlers above — TS's control
  // flow analysis can't see that closure-driven mutation and narrows this to a literal `true`.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (running) {
    await tick(client).catch((error: unknown) => {
      log.error({ err: error }, "scheduler tick failed");
    });
    await sleep(TICK_MS);
  }

  await client.end();
  await prisma.$disconnect();
  log.info("scheduler exited cleanly");
  process.exit(0);
}

main().catch((error: unknown) => {
  log.error({ err: error }, "scheduler crashed");
  process.exit(1);
});
