/**
 * Every job handler must throw one of these three — never a bare Error — so the worker's
 * completion logic (server/db + workers/worker.ts) can dispatch to the right queue
 * transition without guessing at intent from an error message.
 */

/** Transient failure (network blip, proxy hiccup, timeout) — backoff and requeue. */
export class RetryableError extends Error {
  constructor(
    message: string,
    readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "RetryableError";
  }
}

/** Permanent failure for this payload (selector broke, malformed payload) — goes to DEAD immediately. */
export class FatalError extends Error {
  constructor(
    message: string,
    readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "FatalError";
  }
}

/** Checkpoint/authwall/999/captcha — trips the circuit breaker. Never retried (CLAUDE.md invariant #3). */
export class RiskSignalError extends Error {
  constructor(
    message: string,
    readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "RiskSignalError";
  }
}

/**
 * Not a failure — an advisory-lock push-back or an outside-active-hours/quota-exhausted
 * guard. Requeues at an exact `runAt` without touching `attempts` or `lastError` the way a
 * retry would (ARCHITECTURE.md §9: "rescheduled ... not retried").
 */
export class RescheduleError extends Error {
  constructor(
    message: string,
    readonly runAt: Date,
  ) {
    super(message);
    this.name = "RescheduleError";
  }
}
