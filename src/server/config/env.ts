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
    .transform((value) =>
      value === undefined ? defaultValue : value.trim().toLowerCase() === "true",
    );
}

/**
 * Only what genuinely must be readable before the database can be queried at all:
 * connection strings, secrets used to decrypt other secrets, and NextAuth's own boot
 * config. Everything else this project used to read from `.env` — worker/queue timing,
 * scraping pacing/quotas, proxy toggles — now lives in the DB (`ScrapingPolicy` and
 * `SystemSetting` singletons, see `src/modules/settings/`) and is edited from `/config`.
 * See `docs/configuration.md` for the full list and why each of these specific few could
 * not follow.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // NextAuth / Auth.js — app login (ARCHITECTURE.md §13 stage 8, pulled forward).
  APP_URL: z.url().default("http://localhost:3000"),
  AUTH_URL: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  AUTH_SECRET: z.string().optional().default(""),
  AUTH_TRUST_HOST: booleanString(true),

  // Bootstrap-only: read by prisma/seed.ts to create the first ADMIN User. Not read anywhere
  // else — further users are created from the dashboard by an existing admin.
  ADMIN_EMAIL: z.string().optional().default(""),
  ADMIN_PASSWORD: z.string().optional().default(""),

  // AES-256-GCM master key for LinkedInAccount/Proxy/ScrapingPolicy-fallback-proxy secrets
  // and sealed storageState. Optional here so stage-2 queue work (which never seals/unseals
  // anything) doesn't require it; server/crypto/secretBox.ts throws its own clear error the
  // moment something actually tries to seal or unseal without it.
  ENCRYPTION_KEY: z.string().optional().default(""),
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

export const env = Object.freeze(parsed.data);
export type Env = typeof env;

// Configure the secret box once, at the end of parsing — only if a key was actually
// supplied. Stage-2 queue code never seals/unseals anything, so an absent key here is not
// itself a boot failure; secretBox.ts throws its own clear error the moment something tries
// to use it unconfigured (Stage 3/4).
if (env.ENCRYPTION_KEY) {
  configureSecretBox(env.ENCRYPTION_KEY, env.AUTH_SECRET);
}
