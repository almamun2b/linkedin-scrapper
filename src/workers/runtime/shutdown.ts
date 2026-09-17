import { logger } from "@/server/logger";

const log = logger.child({ module: "shutdown" });

export interface ShutdownController {
  /** Aborts when SIGTERM/SIGINT is received. Combine with per-job cancellation checks. */
  readonly signal: AbortSignal;
  isShuttingDown(): boolean;
  /** Registers an in-flight job promise so shutdown can wait for it to finish (or hard-exit). */
  trackJob<T>(promise: Promise<T>): Promise<T>;
  waitForDrain(): Promise<void>;
}

/**
 * On SIGTERM/SIGINT: stop claiming new work (the caller checks `isShuttingDown()` in its poll
 * loop), let in-flight handlers reach their next cancellation checkpoint, then hard-exit after
 * `gracefulMs` regardless — a stuck handler must never block process exit indefinitely.
 */
export function createShutdownController(gracefulMs: number): ShutdownController {
  const controller = new AbortController();
  let shuttingDown = false;
  const inFlight = new Set<Promise<unknown>>();

  function requestShutdown(signalName: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info({ signal: signalName, gracefulMs }, "shutdown requested, draining in-flight jobs");
    controller.abort();
    const hardExit = setTimeout(() => {
      log.error({ gracefulMs }, "graceful shutdown window elapsed — forcing exit");
      process.exit(1);
    }, gracefulMs);
    hardExit.unref();
  }

  process.once("SIGTERM", () => {
    requestShutdown("SIGTERM");
  });
  process.once("SIGINT", () => {
    requestShutdown("SIGINT");
  });

  return {
    signal: controller.signal,
    isShuttingDown: () => shuttingDown,
    trackJob(promise) {
      inFlight.add(promise);
      const cleanup = () => inFlight.delete(promise);
      promise.then(cleanup, cleanup);
      return promise;
    },
    async waitForDrain() {
      await Promise.allSettled([...inFlight]);
    },
  };
}
