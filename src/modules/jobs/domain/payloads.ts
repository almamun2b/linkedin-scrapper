import { z } from "zod";
import { FilterRefKind } from "@/generated/prisma/enums";

export const noopPayloadSchema = z.object({
  echo: z.string().optional(),
  sleepMs: z.number().int().nonnegative().optional(),
});
export type NoopPayload = z.infer<typeof noopPayloadSchema>;

export const sessionEnsurePayloadSchema = z.object({
  linkedInAccountId: z.string().min(1),
});
export type SessionEnsurePayload = z.infer<typeof sessionEnsurePayloadSchema>;

export const profileSelfScrapePayloadSchema = z.object({
  linkedInAccountId: z.string().min(1),
  profileUrl: z.url(),
});
export type ProfileSelfScrapePayload = z.infer<typeof profileSelfScrapePayloadSchema>;

export const runStartPayloadSchema = z.object({
  scrapeRunId: z.string().min(1),
});
export type RunStartPayload = z.infer<typeof runStartPayloadSchema>;

export const searchPageFetchPayloadSchema = z.object({
  scrapeRunId: z.string().min(1),
  page: z.number().int().min(1),
});
export type SearchPageFetchPayload = z.infer<typeof searchPageFetchPayloadSchema>;

export const profileScrapePayloadSchema = z.object({
  scrapeRunId: z.string().min(1),
  leadId: z.string().min(1),
  profileUrl: z.url(),
});
export type ProfileScrapePayload = z.infer<typeof profileScrapePayloadSchema>;

export const runFinalizePayloadSchema = z.object({
  scrapeRunId: z.string().min(1),
});
export type RunFinalizePayload = z.infer<typeof runFinalizePayloadSchema>;

export const searchTypeaheadResolvePayloadSchema = z.object({
  linkedInAccountId: z.string().min(1),
  kind: z.enum(FilterRefKind),
  query: z.string().min(1),
});
export type SearchTypeaheadResolvePayload = z.infer<typeof searchTypeaheadResolvePayloadSchema>;

export const JOB_TYPES = [
  "noop",
  "session.ensure",
  "profile.self.scrape",
  "run.start",
  "search.page.fetch",
  "profile.scrape",
  "run.finalize",
  "search.typeahead.resolve",
] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const payloadSchemaByType = {
  noop: noopPayloadSchema,
  "session.ensure": sessionEnsurePayloadSchema,
  "profile.self.scrape": profileSelfScrapePayloadSchema,
  "run.start": runStartPayloadSchema,
  "search.page.fetch": searchPageFetchPayloadSchema,
  "profile.scrape": profileScrapePayloadSchema,
  "run.finalize": runFinalizePayloadSchema,
  "search.typeahead.resolve": searchTypeaheadResolvePayloadSchema,
} as const satisfies Record<JobType, z.ZodType>;
