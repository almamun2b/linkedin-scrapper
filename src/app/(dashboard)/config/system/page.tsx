import { env } from "@/server/config/env";

function mask(value: string): string {
  return value ? "•••• (set)" : "(not set)";
}

const ROWS: Array<{ label: string; value: string; secret?: boolean }> = [
  { label: "NODE_ENV", value: env.NODE_ENV },
  { label: "WORKER_ID", value: env.WORKER_ID },
  { label: "WORKER_CONCURRENCY", value: String(env.WORKER_CONCURRENCY) },
  { label: "WORKER_QUEUES", value: env.WORKER_QUEUES },
  { label: "POLL_INTERVAL_MS", value: String(env.POLL_INTERVAL_MS) },
  { label: "LEASE_SECONDS", value: String(env.LEASE_SECONDS) },
  { label: "LEASE_HEARTBEAT_MS", value: String(env.LEASE_HEARTBEAT_MS) },
  { label: "SHUTDOWN_GRACE_MS", value: String(env.SHUTDOWN_GRACE_MS) },
  { label: "HEADLESS (seed default)", value: String(env.HEADLESS) },
  { label: "TZ", value: env.TZ },
  { label: "LOG_LEVEL", value: env.LOG_LEVEL },
  { label: "DATABASE_URL", value: env.DATABASE_URL, secret: true },
  { label: "ENCRYPTION_KEY", value: env.ENCRYPTION_KEY, secret: true },
  { label: "AUTH_SECRET", value: env.AUTH_SECRET, secret: true },
];

export default function SystemPage() {
  return (
    <div className="max-w-xl">
      <p className="mb-4 text-sm text-[--color-muted]">
        These are process-boot settings read once from <code>.env</code> at startup — there is no
        write path here. Changing one means editing <code>.env</code> and restarting the worker
        and/or web process; a value shown here cannot be hot-applied from this page.
      </p>
      <dl className="divide-y divide-[--color-border] rounded-[--radius-card] border border-[--color-border] bg-[--color-surface]">
        {ROWS.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-4 py-2 text-sm">
            <dt className="text-[--color-muted]">{row.label}</dt>
            <dd className="font-mono text-xs text-[--color-fg]">{row.secret ? mask(row.value) : row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
