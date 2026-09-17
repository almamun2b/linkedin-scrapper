import { z } from "zod";

/**
 * Mirrors the DB's own column defaults/ranges so the UI rejects bad input before Postgres
 * does. `.refine` pairs keep the error attached to the field the user should actually fix.
 */
export const updatePolicySchema = z
  .object({
    linkedInAccountId: z.string().min(1),
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
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
