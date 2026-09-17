import { createHash } from "node:crypto";
import { z } from "zod";

export const fingerprintSchema = z.object({
  // Never fabricated — filled in from the real launched browser on its first-ever session
  // (ARCHITECTURE.md §9 layer 6: "clumsy spoofing is more detectable than plain automation").
  userAgent: z.string().nullable(),
  viewport: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
  locale: z.string(),
  timezoneId: z.string(),
  deviceScaleFactor: z.number().positive(),
});
export type AccountFingerprint = z.infer<typeof fingerprintSchema>;

const VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1920, height: 1080 },
] as const;
const LOCALES = ["en-US", "en-GB"] as const;
const TIMEZONES = ["America/New_York", "America/Chicago", "Europe/London", "Asia/Dhaka"] as const;

function pick<T>(items: readonly T[], seed: string): T {
  const hash = createHash("sha256").update(seed).digest();
  const value = items[(hash[0] ?? 0) % items.length];
  if (value === undefined) {
    throw new Error("pick() called with an empty items array");
  }
  return value;
}

/**
 * Deterministic (by email, not random) so bootstrapping the same account twice — or
 * replaying this in a test — always derives the same starting shape. Everything except
 * `userAgent` is stable from creation; `userAgent` waits for a real browser to report it.
 */
export function deriveInitialFingerprint(email: string): AccountFingerprint {
  return {
    userAgent: null,
    viewport: pick(VIEWPORTS, `${email}:viewport`),
    locale: pick(LOCALES, `${email}:locale`),
    timezoneId: pick(TIMEZONES, `${email}:timezoneId`),
    deviceScaleFactor: 1,
  };
}
