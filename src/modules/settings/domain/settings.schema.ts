import { z } from "zod";

/**
 * Mirrors ScrapingPolicy's own column defaults/ranges and the SQL CHECKs that back them
 * (`prisma/migrations/.../migration.sql`), same pattern as the per-account schema this
 * replaced. No `linkedInAccountId` — there is exactly one row, id "global".
 */
export const updateScrapingPolicySchema = z
  .object({
    stepDelayMinMs: z.coerce.number().int().min(0),
    stepDelayMaxMs: z.coerce.number().int().min(0),
    profileDelayMinMs: z.coerce.number().int().min(0),
    profileDelayMaxMs: z.coerce.number().int().min(0),
    pageDelayMinMs: z.coerce.number().int().min(0),
    pageDelayMaxMs: z.coerce.number().int().min(0),
    sessionBreakAfter: z.coerce.number().int().min(1),
    sessionBreakMinMs: z.coerce.number().int().min(0),
    sessionBreakMaxMs: z.coerce.number().int().min(0),
    maxProfilesPerDay: z.coerce.number().int().min(1).max(200),
    maxSearchPagesPerDay: z.coerce.number().int().min(1).max(200),
    maxProfilesPerWeek: z.coerce.number().int().min(1).max(1000),
    activeHoursStart: z.coerce.number().int().min(0).max(23),
    activeHoursEnd: z.coerce.number().int().min(0).max(23),
    activeOnWeekends: z.coerce.boolean(),
    useProxy: z.coerce.boolean(),
    headless: z.coerce.boolean(),
    fallbackProxyUrl: z.string().trim().optional(),
    proxyCountry: z.string().trim().min(1).optional(),
  })
  .refine((v) => v.stepDelayMinMs <= v.stepDelayMaxMs, {
    message: "Step delay min must be ≤ max",
    path: ["stepDelayMinMs"],
  })
  .refine((v) => v.profileDelayMinMs <= v.profileDelayMaxMs, {
    message: "Profile delay min must be ≤ max",
    path: ["profileDelayMinMs"],
  })
  .refine((v) => v.pageDelayMinMs <= v.pageDelayMaxMs, {
    message: "Page delay min must be ≤ max",
    path: ["pageDelayMinMs"],
  })
  .refine((v) => v.sessionBreakMinMs <= v.sessionBreakMaxMs, {
    message: "Session break min must be ≤ max",
    path: ["sessionBreakMinMs"],
  });
export type UpdateScrapingPolicyInput = z.infer<typeof updateScrapingPolicySchema>;

export const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace"] as const;

export const updateSystemSettingSchema = z.object({
  workerId: z.string().trim().min(1),
  workerConcurrency: z.coerce.number().int().min(1).max(32),
  workerQueues: z.string().trim().min(1),
  pollIntervalMs: z.coerce.number().int().min(250),
  leaseSeconds: z.coerce.number().int().min(30),
  leaseHeartbeatMs: z.coerce.number().int().min(1000),
  shutdownGraceMs: z.coerce.number().int().min(1000),
  logLevel: z.enum(LOG_LEVELS),
  displayTimezone: z.string().trim().min(1),
});
export type UpdateSystemSettingInput = z.infer<typeof updateSystemSettingSchema>;
