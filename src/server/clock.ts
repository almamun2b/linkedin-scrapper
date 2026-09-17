export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

/**
 * Test-only fixed clock. Never used to shorten a real delay (CLAUDE.md invariant #8) —
 * only to make a delay's *duration* deterministic in a unit check, via a caller that also
 * controls the sleep implementation.
 */
export function fixedClock(at: Date): Clock {
  return { now: () => at };
}
