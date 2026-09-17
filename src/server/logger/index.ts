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

const baseLogger = pino({
  level: env.LOG_LEVEL,
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
