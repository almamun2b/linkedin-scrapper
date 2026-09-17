import { hostname } from "node:os";
import { prisma } from "@/server/db/prisma";
import { logger } from "@/server/logger";

const log = logger.child({ module: "heartbeat" });

const PACKAGE_VERSION = "0.1.0";

export interface HeartbeatHandle {
  stop(): Promise<void>;
}

export async function startHeartbeat(params: {
  workerId: string;
  queues: string[];
  concurrency: number;
  intervalMs: number;
}): Promise<HeartbeatHandle> {
  const { workerId, queues, concurrency, intervalMs } = params;
  const now = new Date();

  await prisma.workerHeartbeat.upsert({
    where: { id: workerId },
    create: {
      id: workerId,
      pid: process.pid,
      host: hostname(),
      queues,
      concurrency,
      startedAt: now,
      lastSeenAt: now,
      stoppedAt: null,
      version: PACKAGE_VERSION,
    },
    update: {
      pid: process.pid,
      host: hostname(),
      queues,
      concurrency,
      startedAt: now,
      lastSeenAt: now,
      stoppedAt: null,
    },
  });
  log.info({ workerId }, "heartbeat started");

  const timer = setInterval(() => {
    prisma.workerHeartbeat
      .update({ where: { id: workerId }, data: { lastSeenAt: new Date() } })
      .catch((error: unknown) => {
        log.error({ err: error }, "heartbeat renewal failed");
      });
  }, intervalMs);
  timer.unref();

  return {
    async stop() {
      clearInterval(timer);
      await prisma.workerHeartbeat
        .update({ where: { id: workerId }, data: { stoppedAt: new Date() } })
        .catch((error: unknown) => {
          log.error({ err: error }, "heartbeat stop-mark failed");
        });
      log.info({ workerId }, "heartbeat stopped");
    },
  };
}
