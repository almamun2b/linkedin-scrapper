# Configuration reference

Everything below is edited from `/config/policy` (pacing, quotas, active hours, proxy
toggle) and `/config/system` (worker/queue timing, logging). This is the same text shown
by the ⓘ hover-hint next to each field on those pages — defined once in
`src/modules/settings/domain/settingsHelp.ts` so the tooltip and this page can't drift
apart. Defaults below match what a fresh `pnpm db:seed` creates.

## What stays in `.env`, and why

A handful of variables can't move into the database, because they're needed to *reach* the
database, or to decrypt what's in it, before any of this can be read at all:

| Variable | Why it can't move |
| --- | --- |
| `DATABASE_URL` | The connection string itself. |
| `AUTH_SECRET`, `AUTH_TRUST_HOST`, `APP_URL`, `AUTH_URL`, `NEXTAUTH_URL` | NextAuth reads these during its own boot, before a request (and therefore a DB query) happens. |
| `ENCRYPTION_KEY` | Decrypts every sealed column — including the settings below that are themselves sealed (the fallback proxy URL). |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Read once, by `prisma/seed.ts`, to create the first admin user — before any user exists to log in and change a setting. |
| `TZ` | Sets the OS process's own timezone before Node starts handling dates at all. Every stored timestamp is `timestamptz` regardless, so this affects how raw timestamps print in logs, not correctness. |

Everything else that used to live in `.env` — LinkedIn accounts, proxies, scraping pacing,
worker/queue timing — is below, in the database.

## Scraping policy (`/config/policy`)

One global row (`ScrapingPolicy`, id `"global"`) — there's a single pacing policy for every
LinkedIn account this system uses, not one per account.

### Pacing (ms)

| Field | Default | Purpose |
| --- | --- | --- |
| Step delay min / max | 4000 / 11000 | Pause between small actions on a page (typing, clicking). |
| Profile delay min / max | 25000 / 90000 | Pause before opening the next profile in a search. |
| Page delay min / max | 45000 / 150000 | Pause before loading the next page of search results. |
| Session break after | 12 | How many profiles before a longer break. |
| Session break min / max | 600000 / 2700000 | Length of that break (10–45 min), browser closed. |

Pacing is the safety mechanism. It is never shortened to move faster, including while
debugging — inject a fake clock (`src/server/clock.ts`) instead of touching these.

### Quotas

| Field | Default | Purpose |
| --- | --- | --- |
| Max profiles / day | 80 | Hard ceiling, enforced atomically by the queue — a job fails outright rather than exceed it. |
| Max search pages / day | 15 | Same, for search-result pages. |
| Max profiles / week | 350 | Rolling weekly ceiling. |

### Active hours

| Field | Default | Purpose |
| --- | --- | --- |
| Start / end hour | 9 / 18 | Scraping only runs in this window, evaluated in **each account's own timezone**, not the server's or a global one. Does not yet express an overnight window (e.g. 22→06). |
| Active on weekends | off | When off, no scraping jobs run Saturday or Sunday in the account's local time. |

### Toggles & fallback proxy

| Field | Default | Purpose |
| --- | --- | --- |
| Use proxy | off | When on, a job **fails** if no proxy resolves for the account — it never falls back to your real IP. See [proxy-setup.md](proxy-setup.md). |
| Headless browser | on | Off only for local debugging — you'll see the actual browser window. |
| Fallback proxy URL | (none) | Used only when an account has no `Proxy` of its own assigned. Sealed at rest; leave blank to require every account to have its own assigned proxy. |
| Proxy country hint | (none) | Recorded for future proxy-pool selection; not yet consulted by any code. |

## System settings (`/config/system`)

One global row (`SystemSetting`, id `"global"`). A running worker re-reads this on its own
~30 second poll — saving here is not instant, and does not restart anything.

### Worker identity

| Field | Default | Purpose |
| --- | --- | --- |
| Default worker id | `worker-local-1` | Identity a `pnpm worker` process uses if not overridden. A second worker process on the same deployment passes `--worker-id <id>` on the command line instead of getting its own row — there is only ever one `SystemSetting`. |
| Concurrency | 1 | How many jobs one worker process runs at the same time. Jobs for the *same* LinkedIn account never run concurrently regardless of this number — only jobs for different accounts, or non-browser jobs, interleave. Raising this does not raise per-account throughput; add another account instead. |
| Queues (comma-separated) | `default` | Which queue names this worker claims jobs from. |
| Display timezone | `UTC` | Used for dashboard timestamps and as the default timezone for a newly created LinkedIn account. |

### Queue timing

| Field | Default | Purpose |
| --- | --- | --- |
| Poll interval (ms) | 2000 | How often an idle worker checks for new work. |
| Lease (s) | 900 | How long a worker may hold a claimed job before the scheduler assumes it crashed and requeues it. Must exceed your slowest job's real duration, or a slow-but-healthy job gets reclaimed mid-run. |
| Lease heartbeat (ms) | 60000 | How often a running worker renews its heartbeat row. |
| Shutdown grace (ms) | 30000 | How long a worker waits for in-flight jobs to finish before force-exiting on shutdown. |

### Logging

| Field | Default | Purpose |
| --- | --- | --- |
| Log level | `info` | One of `fatal`, `error`, `warn`, `info`, `debug`, `trace` — pino's own level names. |
