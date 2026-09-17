import { env } from "@/server/config/env";
import { logger } from "@/server/logger";
import { prisma } from "@/server/db/prisma";
import * as queueService from "@/modules/jobs/service/queue.service";
import { FatalError } from "@/modules/jobs/domain/errors";
import type { ClaimedJob } from "@/modules/jobs/repository/jobs.repository";
import { createShutdownController, type ShutdownController } from "./runtime/shutdown";
import { startHeartbeat } from "./runtime/heartbeat";
import { handleNoop } from "./handlers/noop";
import { handleSessionEnsure } from "./handlers/session.ensure";
import { handleProfileSelfScrape } from "./handlers/profile.self.scrape";
import { handleRunStart } from "./handlers/run.start";
import { handleSearchPageFetch } from "./handlers/search.page.fetch";
import { handleProfileScrape } from "./handlers/profile.scrape";
import { handleRunFinalize } from "./handlers/run.finalize";
import { handleSearchTypeaheadResolve } from "./handlers/search.typeahead.resolve";

type Handler = (job: ClaimedJob, signal: AbortSignal) => Promise<void>;

// Keyed by Job.type ("verb.noun"), looked up once per claimed job — see the add-job-type skill.
const handlers: Record<string, Handler> = {
  noop: handleNoop,
  "session.ensure": handleSessionEnsure,
  "profile.self.scrape": handleProfileSelfScrape,
  "run.start": handleRunStart,
  "search.page.fetch": handleSearchPageFetch,
  "profile.scrape": handleProfileScrape,
  "run.finalize": handleRunFinalize,
  "search.typeahead.resolve": handleSearchTypeaheadResolve,
};

const log = logger.child({ module: "worker" });

function runJob(job: ClaimedJob, shutdown: ShutdownController, onSettle: () => void): void {
  const localController = new AbortController();
  const forwardShutdown = () => {
    localController.abort();
  };
  shutdown.signal.addEventListener("abort", forwardShutdown);

  // Job.cancelRequestedAt is the per-job cancellation flag (ScrapeRun cancel, /jobs "stop").
  const cancelPoll = setInterval(() => {
    prisma.job
      .findUnique({ where: { id: job.id }, select: { cancelRequestedAt: true } })
      .then((row) => {
        if (row?.cancelRequestedAt) localController.abort();
      })
      .catch(() => undefined);
  }, env.POLL_INTERVAL_MS);
  cancelPoll.unref();

  const promise = (async () => {
    try {
      const handler = handlers[job.type];
      if (!handler) {
        throw new FatalError(`No handler registered for job type "${job.type}"`);
      }
      await handler(job, localController.signal);
      await queueService.finishJob(job, { ok: true });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await queueService.finishJob(job, { ok: false, error: err });
    } finally {
      clearInterval(cancelPoll);
      shutdown.signal.removeEventListener("abort", forwardShutdown);
      onSettle();
    }
  })();

  // Fire-and-forget by design (concurrent job processing) — every failure path inside the
  // IIFE above is already caught and reported via queueService.finishJob.
  void shutdown.trackJob(promise);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(ms: number): number {
  return Math.floor(ms * (0.5 + Math.random()));
}

async function main(): Promise<void> {
  const queues = env.WORKER_QUEUES.split(",")
    .map((q) => q.trim())
    .filter(Boolean);
  const shutdown = createShutdownController(env.SHUTDOWN_GRACE_MS);
  const heartbeat = await startHeartbeat({
    workerId: env.WORKER_ID,
    queues,
    concurrency: env.WORKER_CONCURRENCY,
    intervalMs: env.LEASE_HEARTBEAT_MS,
  });

  log.info(
    { workerId: env.WORKER_ID, queues, concurrency: env.WORKER_CONCURRENCY },
    "worker started",
  );

  let active = 0;
  while (!shutdown.isShuttingDown()) {
    const capacity = env.WORKER_CONCURRENCY - active;
    let claimed = 0;
    if (capacity > 0) {
      for (const queue of queues) {
        if (claimed >= capacity) break;
        const jobs = await queueService.claimBatch({
          queue,
          workerId: env.WORKER_ID,
          leaseSeconds: env.LEASE_SECONDS,
          limit: capacity - claimed,
        });
        for (const job of jobs) {
          claimed++;
          active++;
          runJob(job, shutdown, () => {
            active--;
          });
        }
      }
    }
    if (claimed === 0) {
      await sleep(jitter(env.POLL_INTERVAL_MS));
    }
  }

  log.info("draining in-flight jobs before exit");
  await shutdown.waitForDrain();
  await heartbeat.stop();
  await prisma.$disconnect();
  log.info("worker exited cleanly");
  process.exit(0);
}

main().catch((error: unknown) => {
  log.error({ err: error }, "worker crashed");
  process.exit(1);
});
