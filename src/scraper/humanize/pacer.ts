export interface DelayRange {
  min: number;
  max: number;
}

/** Cancellable sleep — checks the signal before and during the wait (CLAUDE.md invariant #8: real delays, never shortened). */
export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("Aborted"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new Error("Aborted"));
      },
      { once: true },
    );
  });
}

/**
 * Deliberately long-tailed, not uniform — perfectly uniform jitter is itself a detectable
 * signature (ARCHITECTURE.md §9 layer 3). Squaring a uniform [0,1) sample skews toward the
 * low end while still occasionally reaching the max.
 */
export function randomDelay(min: number, max: number): number {
  const t = Math.random() ** 2;
  return Math.round(min + (max - min) * t);
}

export function typingDelay(): number {
  return randomDelay(80, 220);
}

export async function stepDelay(range: DelayRange, signal: AbortSignal): Promise<void> {
  await sleep(randomDelay(range.min, range.max), signal);
}

export async function profileDelay(range: DelayRange, signal: AbortSignal): Promise<void> {
  await sleep(randomDelay(range.min, range.max), signal);
}

export async function pageDelay(range: DelayRange, signal: AbortSignal): Promise<void> {
  await sleep(randomDelay(range.min, range.max), signal);
}
