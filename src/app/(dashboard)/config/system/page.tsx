import { Lock } from "lucide-react";
import { env } from "@/server/config/env";
import { Alert } from "@/components/ui/Alert";
import { DescriptionList } from "@/components/ui/DescriptionList";

function mask(): React.ReactNode {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Lock aria-hidden="true" className="size-3" />
      set
    </span>
  );
}

const ROWS: { label: string; value: string; secret?: boolean }[] = [
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
    <div className="flex max-w-xl flex-col gap-4">
      <Alert tone="info">
        These are process-boot settings read once from <code>.env</code> at startup — there is no
        write path here. Changing one means editing <code>.env</code> and restarting the worker
        and/or web process; a value shown here cannot be hot-applied from this page.
      </Alert>
      <DescriptionList
        items={ROWS.map((row) => ({
          key: row.label,
          label: row.label,
          value: row.secret ? mask() : row.value,
        }))}
      />
    </div>
  );
}
