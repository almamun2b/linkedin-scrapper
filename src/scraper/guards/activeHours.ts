import { TZDate } from "@date-fns/tz";

export interface ActiveHoursPolicy {
  activeHoursStart: number;
  activeHoursEnd: number;
  activeOnWeekends: boolean;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Evaluated in the account's own local wall-clock time (`timezoneId`), not the server's.
 * Does not yet express an overnight wrap (e.g. 22->06) — ARCHITECTURE.md §9 flags this as a
 * known gap, matched here on purpose rather than silently deciding it for this task.
 */
export function isWithinActiveHours(
  now: Date,
  policy: ActiveHoursPolicy,
  timezoneId: string,
): boolean {
  const local = new TZDate(now, timezoneId);
  if (!policy.activeOnWeekends && isWeekend(local)) {
    return false;
  }
  const hour = local.getHours();
  return hour >= policy.activeHoursStart && hour < policy.activeHoursEnd;
}

/** Jobs outside the window are rescheduled to this time, never retried (ARCHITECTURE.md §9). */
export function nextWindowStart(now: Date, policy: ActiveHoursPolicy, timezoneId: string): Date {
  const next = new TZDate(now, timezoneId);
  next.setHours(policy.activeHoursStart, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  while (!policy.activeOnWeekends && isWeekend(next)) {
    next.setDate(next.getDate() + 1);
  }
  return new Date(next.getTime());
}
