import "dotenv/config";
import { z } from "zod";
import { configureSecretBox } from "../crypto/secretBox";

/**
 * `Number("")` is `0` and dotenv parses `FOO=` as `""`, not undefined — without this, an
 * env var present-but-blank would silently win over a schema `.default(...)` instead of
 * falling through to it. Every var below that isn't required goes through this.
 */
function blankToUndefined(value: string | undefined): string | undefined {
  return value === "" ? undefined : value;
}

function booleanString(defaultValue: boolean) {
  return z
    .string()
    .optional()
    .transform((value) => (value === undefined ? defaultValue : value.trim().toLowerCase() === "true"));
}

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // NextAuth / Auth.js — app login (ARCHITECTURE.md §13 stage 8, pulled forward).
  APP_URL: z.string().url().default("http://localhost:3000"),
  AUTH_URL: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  AUTH_SECRET: z.string().optional().default(""),
  AUTH_TRUST_HOST: booleanString(true),

  // Bootstrap-only: read by prisma/seed.ts to create the first ADMIN User. Not read anywhere
  // else — further users are created from the dashboard by an existing admin.
  ADMIN_EMAIL: z.string().optional().default(""),
  ADMIN_PASSWORD: z.string().optional().default(""),

  // AES-256-GCM master key for LinkedInAccount/Proxy secrets and sealed storageState.
  // Bootstrap-only per ARCHITECTURE.md §10 — optional here so stage-2 queue work (which
  // never seals/unseals anything) doesn't require it; server/crypto/secretBox.ts throws its
  // own clear error the moment something actually tries to seal or unseal without it.
  ENCRYPTION_KEY: z.string().optional().default(""),

  // Bootstrap-only: read by prisma/seed.ts to create the sealed LinkedInAccount row. Not
  // read anywhere else — the database is the source of truth once that row exists.
  LINKEDIN_EMAIL: z.string().optional().default(""),
  LINKEDIN_PASSWORD: z.string().optional().default(""),

  // USE_PROXY=true with no resolvable proxy fails the job — never falls back to the direct
  // IP (CLAUDE.md invariant #9). Enforced in scraper/browser/proxy.ts, not here.
  USE_PROXY: booleanString(false),
  PROXY_URL: z.string().optional().default(""),
  PROXY_COUNTRY: z.string().optional().default(""),

  WORKER_ID: z.string().optional(),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(1),
  WORKER_QUEUES: z.string().default("default"),
  HEADLESS: booleanString(true),
  TZ: z.string().default("UTC"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  // Queue timing (ARCHITECTURE.md §6).
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
  LEASE_SECONDS: z.coerce.number().int().positive().default(900),
  LEASE_HEARTBEAT_MS: z.coerce.number().int().positive().default(60000),
  SHUTDOWN_GRACE_MS: z.coerce.number().int().positive().default(30000),

  // Global pacing fallbacks — only consulted before a per-account ScrapingPolicy row
  // exists. db:seed always creates one, so these mirror ScrapingPolicy's own column
  // defaults and are exercised in code without drifting from "the DB default" in practice.
  SCRAPER_STEP_DELAY_MIN_MS: z.coerce.number().int().positive().default(4000),
  SCRAPER_STEP_DELAY_MAX_MS: z.coerce.number().int().positive().default(11000),
  SCRAPER_PROFILE_DELAY_MIN_MS: z.coerce.number().int().positive().default(25000),
  SCRAPER_PROFILE_DELAY_MAX_MS: z.coerce.number().int().positive().default(90000),
  SCRAPER_PAGE_DELAY_MIN_MS: z.coerce.number().int().positive().default(45000),
  SCRAPER_PAGE_DELAY_MAX_MS: z.coerce.number().int().positive().default(150000),
  MAX_PROFILES_PER_DAY: z.coerce.number().int().min(1).max(200).default(80),
  ACTIVE_HOURS_START: z.coerce.number().int().min(0).max(23).default(9),
  ACTIVE_HOURS_END: z.coerce.number().int().min(0).max(23).default(18),
});

const cleanedEnv = Object.fromEntries(
  Object.entries(process.env).map(([key, value]) => [key, blankToUndefined(value)]),
);

const parsed = schema.safeParse(cleanedEnv);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
   
  console.error(`Invalid environment configuration:\n${details}`);
  throw new Error("Environment validation failed — see errors above");
}

const resolved = {
  ...parsed.data,
  WORKER_ID: parsed.data.WORKER_ID ?? `worker-${process.pid}`,
};

export const env = Object.freeze(resolved);
export type Env = typeof env;

// Configure the secret box once, at the end of parsing — only if a key was actually
// supplied. Stage-2 queue code never seals/unseals anything, so an absent key here is not
// itself a boot failure; secretBox.ts throws its own clear error the moment something tries
// to use it unconfigured (Stage 3/4).
if (env.ENCRYPTION_KEY) {
  configureSecretBox(env.ENCRYPTION_KEY, env.AUTH_SECRET);
}
