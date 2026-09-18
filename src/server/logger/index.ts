import pino from "pino";
import { env } from "../config/env";

// Every secret name/shape that must never reach a log line, however deeply nested.
const REDACT_PATHS = [
  "passwordSealed",
  "*.passwordSealed",
  "*.*.passwordSealed",
  "storageStateSealed",
  "*.storageStateSealed",
  "*.*.storageStateSealed",
  "fallbackProxyUrlSealed",
  "*.fallbackProxyUrlSealed",
  "fallbackProxyUrl",
  "*.fallbackProxyUrl",
  "password",
  "*.password",
  "ENCRYPTION_KEY",
  "AUTH_SECRET",
  "passwordHash",
  "*.passwordHash",
  "storageState",
  "*.storageState",
  "cookies",
  "*.cookies",
];

// Level defaults to "info" at construction — `LOG_LEVEL` moved from `.env` into
// `SystemSetting` (src/modules/settings/), so the worker assigns `logger.level` from the DB
// right after it loads settings at boot, and again whenever an admin saves `/config/system`
// (src/workers/worker.ts, src/modules/settings/service/updateSystemSetting.ts). The web
// process keeps this default; it makes no scraping decisions pino's level would need to vary.
const baseLogger = pino({
  level: "info",
  redact: { paths: REDACT_PATHS, censor: "[redacted]" },
  transport:
    env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } }
      : undefined,
});

export const logger = baseLogger;

export function child(bindings: Record<string, unknown>) {
  return baseLogger.child(bindings);
}
