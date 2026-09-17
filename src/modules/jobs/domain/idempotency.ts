import type { Clock } from "@/server/clock";
import { systemClock } from "@/server/clock";

/**
 * "<prefix>:<id>:<yyyy-MM-ddTHH>" — one job of this kind per subject per hour, so a
 * retriggered enqueue (a re-run scheduler tick, a repeated manual trigger) collapses into
 * the existing row instead of racing a duplicate browser session onto the same account.
 */
export function hourBucketKey(prefix: string, id: string, clock: Clock = systemClock): string {
  const now = clock.now();
  const bucket = now.toISOString().slice(0, 13); // "yyyy-MM-ddTHH"
  return `${prefix}:${id}:${bucket}`;
}
