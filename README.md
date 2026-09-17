# linkedin-scrapper

A self-hosted system for searching LinkedIn with structured filters and extracting name /
website / email per person, built on Next.js, Prisma + PostgreSQL, and Playwright.

**Before you use this:** automated collection violates the LinkedIn User Agreement, and
the account used can be restricted at any time regardless of how careful the client is.
This project reduces and contains that risk — pacing, quotas, a circuit breaker — it does
not eliminate it. Email yield from profiles alone is also inherently low (single-digit
percentages); most addresses come from a second enrichment stage against the person's
website. See [ARCHITECTURE.md](ARCHITECTURE.md) §0 before relying on either assumption.

## Prerequisites

- Node 24, pnpm `11.8.0` (`packageManager` in `package.json`)
- PostgreSQL (local or remote)

## Setup

```bash
pnpm install
cp .env.example .env
# fill in DATABASE_URL, AUTH_SECRET, ENCRYPTION_KEY (32 random bytes, base64), and
# ADMIN_EMAIL/ADMIN_PASSWORD for the first admin user — see .env.example for the full list.
# LinkedIn accounts are added afterwards from /config/accounts, not from .env.
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`pnpm exec playwright install --with-deps chromium` is needed once the scraper is wired
up; it is not required to run the web app.

## Scripts

| Command                     | Does                         |
| --------------------------- | ---------------------------- |
| `pnpm dev`                  | Next.js dev server           |
| `pnpm build` / `pnpm start` | production build / serve     |
| `pnpm lint`                 | ESLint                       |
| `pnpm typecheck`            | `tsc --noEmit`               |
| `pnpm db:generate`          | regenerate the Prisma client |
| `pnpm db:migrate`           | `prisma migrate dev`         |
| `pnpm db:seed`              | run `prisma/seed.ts`         |

## Runtime

Three process types share one PostgreSQL database and nothing else (no Redis, no
broker): the Next.js app (web UI + Server Actions, never touches LinkedIn directly), a
worker pool (owns the Playwright browsers, claims jobs from a Postgres-backed queue), and
a singleton scheduler (cron ticks, lease reaping, quota rollover). See
[ARCHITECTURE.md](ARCHITECTURE.md) §12 for the full topology.

## Where to go next

- **[CLAUDE.md](CLAUDE.md)** — commands, Prisma 7 specifics, the non-negotiable invariants
- **[AGENTS.md](AGENTS.md)** — where code goes, size budgets, the review checklist
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — the full design: data model, job queue, the
  account-safety subsystem, build order
