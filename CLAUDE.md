# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A self-hosted LinkedIn people-search extraction system: structured filters in, name /
website / email out. Next.js 16 (App Router) for UI + control plane, Prisma 7 + PostgreSQL
for data **and** the job queue, Playwright for collection, all TypeScript. No test
library — see invariant #10.

This file owns commands, Prisma 7 specifics, and the invariants. AGENTS.md and
ARCHITECTURE.md are plain repo files, not auto-loaded — they cost tokens only when opened,
so open the smallest thing that answers the question:

| Task                       | Start with                                        | Only if still unclear                |
| -------------------------- | ------------------------------------------------- | ------------------------------------ |
| Queue / worker / job type  | the `add-job-type` skill                          | ARCHITECTURE.md §6 (queue mechanics) |
| Scraper, selectors, pacing | the `write-extractor` skill                       | ARCHITECTURE.md §7, §9               |
| Schema / migration         | the `schema-change` skill                         | ARCHITECTURE.md §4 (model inventory) |
| New feature slice          | AGENTS.md §3 (one table, no need to read further) | ARCHITECTURE.md §2                   |
| Config page / env          | this file's Environment section above             | ARCHITECTURE.md §10                  |
| How scraping/proxy/config work, user-facing | `docs/` (README, how-scraping-works, proxy-setup, getting-a-proxy-url, configuration) | ARCHITECTURE.md §7, §9, §10 |

Skills are small and loaded on demand — they carry the how-to. The matching
ARCHITECTURE.md section carries the _why_; read it when the skill doesn't cover the
case, not as a matter of routine. Never read a whole doc to answer a question one
`grep`/section answers.

**Current state:** dependencies installed, full schema + migration landed, agent harness
wired up (see AGENTS.md §9). The application code itself — scraper, queue engine, config
UI, auth — is not yet implemented. When asked to build a feature, follow ARCHITECTURE.md's
structure rather than inventing a new one, and respect the build order in §13 (queue
engine before Playwright).

## Commands

```bash
pnpm dev                 # Next.js dev server (Turbopack)
pnpm build               # production build (output: "standalone")
pnpm start               # serve the production build
pnpm lint                # ESLint 10 flat config
pnpm typecheck           # tsc --noEmit
pnpm db:generate         # regenerate the client into src/generated/prisma
pnpm db:migrate          # prisma migrate dev
pnpm db:push             # schema push (prototyping only, never on a real DB)
pnpm db:seed             # tsx ./prisma/seed.ts
```

pnpm required (`packageManager: pnpm@11.8.0`); Node 24. No `test` script (invariant #10).
Worker/scheduler scripts: `pnpm worker` (`tsx src/workers/worker.ts`), `pnpm worker:dev`
(`tsx watch`, hot-reloads on handler changes), `pnpm scheduler` (`tsx src/workers/scheduler.ts`).
`pnpm worker` accepts `--worker-id <id>` to run a second worker process alongside the
first — see `src/modules/settings/` (§10).

## Environment

`.env` is gitignored, `.env.example` tracked. It now holds only what must be readable
before the database can be queried or its secrets decrypted at all: `DATABASE_URL`,
NextAuth URLs/secret, `ENCRYPTION_KEY`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` for the first admin
user, and `TZ` (sets the OS process's own timezone before any DB read is possible).
Everything else this project once configured via env — LinkedIn accounts, proxies,
scraping pacing/quotas/active-hours, worker/queue timing — lives in the database and is
edited from `/config`, seeded with the same defaults those variables used to carry
(`prisma/seed.ts`, `src/modules/settings/`). LinkedIn accounts specifically are never read
from env at all — they're added from `/config/accounts`. ARCHITECTURE.md §10 has the full
table of what remains, and `docs/configuration.md` documents every DB-backed setting.

Once `server/config/env.ts` exists, **read env only through it** — no `process.env` access
anywhere else, so a missing variable fails at boot instead of inside a browser launch.

## Prisma 7 specifics (these trip people up)

- Generator is `prisma-client` (not the legacy `prisma-client-js`); output is
  `src/generated/prisma` and **is committed**. Import from there, never `@prisma/client`.
- **Schema is a folder**, `prisma/schema/*.prisma` split by domain (auth, account, search,
  lead, jobs, audit), not one file — `prisma.config.ts`'s `schema` option points at the
  directory. Prisma recursively loads every `*.prisma` file in it.
- The `datasource` block has **no `url`** — by design. The URL comes from
  `prisma.config.ts` via `env("DATABASE_URL")`.
- A **driver adapter is mandatory**: `PrismaPg` from `@prisma/adapter-pg`, wired in
  `src/lib/prisma.ts`, which also sets a client-level `omit` for every sealed column and
  `User.passwordHash` — don't re-select them without a reason in the same query.
- `Bytes` fields come back as `Uint8Array` in the client, not `Buffer`.
- `prisma/seed.ts` runs through `tsx`, configured in `prisma.config.ts` (not in
  `package.json`).
- A destructive command (`migrate reset`, etc.) triggers Prisma's own agent-safety gate,
  which refuses to run without the user's explicit, same-turn consent passed via
  `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`. Never try to bypass or pre-empt it — ask
  first, exactly as it requires.
- Six Prisma skills are vendored in `.claude/skills/` (CLI, client API, database setup,
  Postgres, Compute, v7 upgrade) — use them for Prisma questions instead of guessing.
  `.mcp.json` has **two** Prisma entries: `prisma` (hosted, needs OAuth, dead in
  non-interactive sessions) and `prisma-local` (`pnpm exec prisma mcp`, no auth, works
  everywhere) — prefer the local one unless the hosted one is already authenticated.
  `.mcp.json` also has `next-devtools` (`next-devtools-mcp`), which auto-connects to a
  running `pnpm dev` for live errors/routes/Server-Action introspection — it exists to
  debug _this app's own_ dev server, never to browse or test against linkedin.com.

## Non-negotiable invariants

Violating any of these is a defect regardless of whether the build passes:

1. **Never run Playwright, or call LinkedIn, from the Next.js request path.** Actions and
   route handlers enqueue a `Job` and return; browsers live only in `src/workers/` (scrape
   steps sleep for minutes, which a recycled request handler can't survive).
2. **One LinkedIn account = at most one live session, process-wide.** Enforced by a
   Postgres advisory lock on the account id, not by in-memory state. Parallel sessions
   from one account are a top detection signal.
3. **Never auto-retry through a challenge.** A `/checkpoint/`, authwall, HTTP 999, or
   captcha trips the breaker: save cookies, close the browser, mark the account
   `CHALLENGED`, cancel its queued jobs, require a human — retrying turns a warning into a
   permanent restriction.
4. **Secrets are sealed at rest and never leave the worker.** Passwords, Playwright
   `storageState`, and proxy credentials are AES-256-GCM ciphertext columns; the client
   `omit` keeps them out of default selects; the logger redacts them.
5. **Every Server Action re-authorizes.** Actions are directly addressable POST
   endpoints — a layout or middleware check does not protect them.
6. **Prisma only in `repository/` files, raw SQL only in `server/db/raw/`** (the queue's
   `FOR UPDATE SKIP LOCKED` can't be expressed via Prisma's query API — quote every
   identifier there, since PascalCase/camelCase names aren't Postgres's default folding).
7. **Always write a `LeadSnapshot`** alongside parsed `Lead` fields, so a selector fix can
   be replayed offline (`pnpm reparse`, AGENTS.md §9) instead of re-scraping. Quota is
   irreplaceable.
8. **Delays are never removed or shortened to move faster**, including while debugging.
   Pacing is the safety mechanism. Inject a fake clock (`server/clock.ts`) instead.
9. **`ScrapingPolicy.useProxy = true` (edited from `/config/policy`, formerly the `USE_PROXY`
   env var) with an unresolvable proxy fails the job** — never fall back to the direct IP,
   which would expose the real egress address exactly when you believed it was hidden.
10. **No script, example, or dev utility may hit linkedin.com.** Only the worker's paced,
    guarded path may — there is no test suite to exempt, because there is no test suite.

## Size budgets

Hard ceilings, enforced on new and edited code: **functions, Server Actions, route
handlers and job handlers ≤100 lines; React components ≤150 lines; every other module
(service, repository, page object, extractor, util) ≤300 lines.** Exceeding one is the
signal that a layer leaked — an over-long action is doing service work, an over-long job
handler should be split into two job types. Split it in the same change; never meet a
ceiling by collapsing lines or deleting the anti-detection comments in `scraper/`.
Split recipes per layer and the exemption list (generated client, `selectors.ts`) are in
[AGENTS.md](AGENTS.md) §4.1.

## Context worth knowing

- **Legality:** automated collection breaks LinkedIn's User Agreement; the account can be
  restricted regardless of care taken. The architecture _reduces and contains_ that risk,
  never eliminates it — don't describe any configuration as "safe" or "zero risk."
- **Email yield is inherently low** — only 1st-degree connections or members who published
  one; expect single-digit percentages from profiles alone. Most addresses come from
  `lead.enrich` (website/company domain), hence `emailSource`/`emailConfidence` on `Lead`.
- **Throughput is capped by the account's daily activity budget**, not by hardware. Scale
  by adding accounts and sticky proxies; never by raising per-account concurrency.
- `tsconfig.json` maps `@/*` → repo root (`./*`), so the import is `@/src/lib/prisma`.
  ARCHITECTURE.md §3.1 recommends switching it to `./src/*` before application code
  lands; if you do, convert every import in the same change — do not mix conventions.
- `playwright` is a **devDependency on purpose** — it's imported only from
  `src/workers/`/`src/scraper/`, and the standalone build must not try to bundle it.
