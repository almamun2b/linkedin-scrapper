# Architecture

Production architecture for a self-hosted LinkedIn people-search extraction system.

**Status:** foundations, the queue engine, a `LinkedInAccount` bootstrap, and a first
scraper slice (`session.ensure` + `profile.self.scrape` — login and a self-profile check,
stage 4 of §13) have landed and are verified against real Postgres up through the point of
an actual linkedin.com call, which no agent may make (CLAUDE.md invariant #10). Config UI,
NextAuth, and the search/lead-scraping pipeline (§13 stages 3's UI, 5–8) are not yet
implemented. Treat this file as the contract those implementations must satisfy. See
[CLAUDE.md](CLAUDE.md) for commands and binding invariants, [AGENTS.md](AGENTS.md) for
where code goes and how to work in this repo.

**Not auto-loaded** — unlike CLAUDE.md, nothing here costs a token until it's opened.
CLAUDE.md's routing table names the specific `## N.` section a task needs; read that
section, not the whole file, unless you're doing something genuinely novel in this area.

---

## 0. Read this first: what is and is not achievable

The request behind this design is "scraping that works perfectly without any risk."
That outcome does not exist, and an architecture that pretends otherwise will fail in
production. Three facts shape every decision in this document:

1. **Automated collection violates the LinkedIn User Agreement.** It is not a technical
   question. The account used can be restricted or permanently closed at LinkedIn's sole
   discretion, at any time, regardless of how careful the client is. Risk can be reduced,
   never eliminated. Design for *detection and containment*, not for invincibility.
   Commercial/compliant alternatives, if the project ever needs them: LinkedIn Marketing
   and Talent Solutions APIs, or a licensed data provider.
2. **Email addresses are mostly not on LinkedIn.** The contact-info panel exposes an
   email only when the member is a 1st-degree connection or has deliberately made it
   public. Expect a **single-digit percentage** email yield from profiles alone. Websites
   appear more often. The realistic path to email is a second stage: take the website or
   company domain from the profile and resolve an address there. The architecture
   therefore separates `profile.scrape` (what LinkedIn shows) from `lead.enrich` (what we
   derive), and records `emailSource` + `emailConfidence` so downstream consumers can
   tell a verified address from a guess.
3. **The account, not the code, is the scarce resource.** Throughput is capped by a daily
   human-plausible activity budget (low hundreds of profile views per day at the
   absolute most, and a fraction of that is safer), not by CPU, Playwright, or the
   database. Every design choice below optimizes for *survivability per account*, and
   throughput scales by adding accounts + proxies, never by adding concurrency to one
   account.

Consequence for the architecture: the scraper is a **slow, resumable, self-throttling
pipeline with a hard circuit breaker**, not a crawler.

---

## 1. Current state

| Area | What exists |
| --- | --- |
| Framework | Next.js `16.2.9`, App Router, React `19.2.7`, `output: "standalone"`, Tailwind v4 |
| Language | TypeScript `6.0.3`, `strict: true`, ESM (`"type": "module"`) |
| ORM | Prisma `7.10`, `prisma-client` generator → `src/generated/prisma` (committed), driver adapter `@prisma/adapter-pg` |
| Prisma config | `prisma.config.ts`; schema is a folder (`prisma/schema/*.prisma`), not one file; datasource URL via `env("DATABASE_URL")` |
| DB | PostgreSQL, one migration (`init`) with the full domain model — see §4 |
| Lint | ESLint `10` flat config (`eslint.config.mjs`) |
| Package manager | pnpm `11.8.0`, Node `24` |
| Agent tooling | `.mcp.json` (Prisma MCP, needs auth), `.claude/` + `.agents/` skills and harness — see AGENTS.md §9 |

Wired into application code: `playwright`, `zod`, `pg`, `pino`, `date-fns` + `@date-fns/tz`,
`cheerio`, `next-auth@beta` + `@auth/prisma-adapter` + `bcryptjs` (see §11). `server/`, the
job queue (`workers/worker.ts` + `workers/scheduler.ts`), auth (`modules/auth`, login page,
`(dashboard)` layout, `src/proxy.ts`), user management, the `/config` UI (accounts,
proxies, scraping policy, a read-only system tab), the search module (filter builder,
`SearchDefinition`/`ScrapeRun`/`FilterRef`, the full `run.start → session.ensure →
search.page.fetch → profile.scrape → run.finalize` job chain), the `lead` module, and the
`/jobs` dashboard all exist. **Auth was pulled forward ahead of its originally-planned
stage 8** (§13) at the user's explicit request — it landed alongside the config/search
work in the same pass, not after it.

Not yet present: `croner`-based cron evaluation (`workers/scheduler.ts` is reaper-only so
far — see §6.6), `lead.enrich` (website-visit email enrichment — deliberately deferred,
LinkedIn's own contact-info panel already covers "extract name/email/website"), and a
confirmed, working `search.typeahead.resolve` handler — its plumbing (lock, session,
`FilterRef` upsert) is in place but the actual LinkedIn typeahead endpoint/selectors are
unverified by design (CLAUDE.md invariant #10: no agent may probe live linkedin.com to
find them). Until a human supplies that endpoint from their own browser devtools, the
Locations/Current-companies pickers work only from whatever `FilterRef` rows already
exist. No test library is installed, by decision — see CLAUDE.md's invariant on it.

---

## 2. Architectural style

**Modular monolith, feature-sliced, with a hard transport boundary** — plus **out-of-process
workers** that share only the database.

Why not microservices: the system has one bounded context and one hard constraint (a
single LinkedIn session per account). Splitting it buys nothing and makes the "one
session at a time" invariant a distributed-locking problem.

Why workers must be separate OS processes: a Playwright browser is a long-lived, stateful,
memory-heavy resource that a short-lived, horizontally-scaled request handler cannot own
safely; scrape steps intentionally sleep for minutes, which nothing in an HTTP request
path may ever do; and the worker needs the decryption key and proxy credentials while the
web process does not, so keeping them apart shrinks the blast radius.

**The one rule that follows from this:** the web app only ever *writes rows* to the
database. It never launches a browser, never calls LinkedIn, never decrypts a password.
Pressing "Test connection" in the UI enqueues a job; it does not log in.

### 2.1 Layers

```
┌──────────────────────────────────────────────────────────────┐
│ app/            Next.js App Router — routing, RSC, forms     │  transport
│                 Server Actions are thin: parse → call → revalidate
├──────────────────────────────────────────────────────────────┤
│ modules/<slice> Feature slices: the application core         │  application
│   domain/       types, zod schemas, pure rules (no I/O)      │  + domain
│   service/      use cases, transactions, orchestration       │
│   repository/   the only place Prisma is touched             │
│   actions.ts    Server Actions for this slice                │
│   ui/           components owned by this slice               │
├──────────────────────────────────────────────────────────────┤
│ server/         cross-cutting infrastructure                 │  infrastructure
│                 db, config/env, crypto, logger, clock, result│
├──────────────────────────────────────────────────────────────┤
│ scraper/        Playwright: browser, session, page objects,  │  infrastructure
│                 extractors, humanizer, guards                │  (worker-only)
├──────────────────────────────────────────────────────────────┤
│ workers/        process entrypoints: worker, scheduler       │  composition
└──────────────────────────────────────────────────────────────┘
```

Dependency rule, enforced by review (and ideally by an ESLint `no-restricted-imports`
boundary): **downward only**. `app` → `modules` → `server`. `workers` → `modules` +
`scraper` + `server`. `scraper` never imports `modules` (it receives plain inputs and
returns plain results, so extractors are re-runnable over stored snapshots without a
test framework — see §7). `modules` never imports `app`. Nothing imports `workers`.

---

## 3. Folder structure

The layer skeleton from §2.1, realized as directories. Placement of any *specific* file —
"where does a new job handler go", "where does a Server Action live" — is answered by
AGENTS.md §3 ("Where code goes"), not repeated here.

```
prisma/
  schema/          # *.prisma files, grouped by domain — see §4
  migrations/
  seed.ts
src/
  app/              # (auth)/, (dashboard)/{config,searches,runs,leads,jobs}/, api/
  modules/          # auth, linkedin-account, proxy, policy, search, run, lead, jobs, audit
  server/           # config/env.ts, db/, crypto/secretBox.ts, logger/, clock.ts, result.ts
  scraper/          # browser/, session/, pages/, extract/, humanize/, guards/
  workers/          # worker.ts, scheduler.ts, handlers/, runtime/
  ui/               # shared design-system primitives
  generated/prisma/ # Prisma output — generated, do not edit
docs/
  runbook.md  selectors.md  legal.md
```

### 3.1 Path alias gotcha

`tsconfig.json` maps `"@/*" → ["./*"]` (repo root), so the import is `@/src/lib/prisma`,
not `@/lib/prisma`. **Recommendation:** change it to `["./src/*"]` before writing
application code, and use `@/modules/...`, `@/server/...` throughout. Doing it later
means touching every import. Decide once; do not mix conventions.

---

## 4. Data model

The schema is split across `prisma/schema/*.prisma` by domain — those files are the data
model now; this section states the principles and a one-line inventory, not a prose copy
(which would drift the moment the schema changes and the doc doesn't).

**Principles:** secrets are always sealed `Bytes` columns with a `keyVer` sibling for key
rotation, never selected by default (client-level `omit` in `src/lib/prisma.ts`); every
`DateTime` is `@db.Timestamptz(3)`, no exceptions — a naive `TIMESTAMP` column compares
against `now()` through the session timezone, which silently breaks every queue
visibility check and active-hours window (confirmed live against this project's own
Postgres server, which runs `Asia/Dhaka`); leads outlive runs, so nothing cascades into
`Lead` or `LeadSnapshot` from a run/search deletion; every scraped fact carries
provenance; the queue is a first-class table, not bolted on.

| File | Models |
| --- | --- |
| `schema/schema.prisma` | `generator client`, `datasource db` |
| `schema/auth.prisma` | `User` (incl. `disabledAt`, added when auth landed), `Account`, `Session`, `VerificationToken`, `enum Role` |
| `schema/account.prisma` | `LinkedInAccount`, `Proxy`, `ScrapingPolicy` + 3 enums |
| `schema/search.prisma` | `SearchDefinition`, `FilterRef`, `ScrapeRun`, 2 enums |
| `schema/lead.prisma` | `Lead`, `LeadSnapshot`, `RunLead`, 2 enums |
| `schema/jobs.prisma` | `Job`, `JobLog`, `RateBudget`, `WorkerHeartbeat`, 2 enums |
| `schema/audit.prisma` | `AuditEvent` |

Worth knowing before reading the schema files directly:

- **`LinkedInAccount`-related FKs are named `linkedInAccountId`**, not `accountId` —
  `accountId` collides with NextAuth's mandatory `Account` model once auth lands, and
  that collision is worse than the extra characters.
- **`ScrapingPolicy.linkedInAccountId` is required**, not nullable. There is no "global
  default row" in this table — global pacing defaults live in `server/config/env.ts`
  (§10); a `ScrapingPolicy` row exists only as a per-account *override*. A nullable
  unique column cannot enforce "exactly one default row" in Postgres (NULLs are
  distinct), so the ambiguity is deleted rather than guarded.
- **`Lead.raw` does not exist.** The raw evidence lives in `LeadSnapshot` (1:N from
  `Lead`), not as a column on the hot `Lead` row — Prisma selects every scalar by
  default, so a blob column on `Lead` would drag HTML into the leads grid's `findMany`.
  `LeadSnapshot` also keeps *history*, not just the latest capture, so a selector fix can
  be replayed over exactly the snapshots a broken extractor version produced (§7).
- **`Job`'s queue index is `[queue, status, priority, runAt]`**, matching the claim
  query's equality predicate then its `ORDER BY` exactly — see §6.1 for why the column
  order is load-bearing, not stylistic.
- **`RateBudget` uses structured columns** (`scope`, `scopeId`, `metric`, `windowStart`,
  `windowEnd`, `consumed`, `cap`) rather than a string key — it needs indexable, queryable
  shape, and the decrement must be one atomic conditional `UPDATE` (§9.4), which a string
  key makes awkward to express safely.
- **`Lead.stage`** (`STUB | SCRAPED | ENRICHED | FAILED`) tracks pipeline progress per
  lead, so a halted run can resume at the right point and "no email" can be told apart
  from "not yet scraped."
- CHECK constraints that Prisma's schema language cannot express declaratively
  (`emailConfidence` 0–100, `ScrapingPolicy`'s min<max delay pairs, a hard ceiling on
  `maxProfilesPerDay`) were added by hand-editing the migration SQL *before* it was first
  applied (`prisma migrate dev --create-only`) — not an edit of already-applied SQL.

---

## 5. Authentication (app-level, NextAuth — implemented)

NextAuth v5 (`next-auth@beta`) + `@auth/prisma-adapter`, one Credentials provider with
`bcryptjs`-hashed passwords (no public sign-up: first admin via `db:seed` reading
`ADMIN_EMAIL`/`ADMIN_PASSWORD`, further users created from `/users` by an existing admin),
JWT sessions, `AUTH_SECRET` in `.env`. Lives in `modules/auth/`:

- `service/authConfig.ts` — the `NextAuthConfig`: `PrismaAdapter(prisma)` (the one named
  exception to "Prisma only in `repository/`" — it's the adapter's own contract), the
  Credentials provider, and `jwt`/`session` callbacks that re-check the user's
  role/`disabledAt` on **every** touch, not just at login, so disabling a user takes
  effect immediately. Casts `token`/`session.user` to a local `AppSessionUser` type rather
  than relying on `declare module` augmentation of next-auth's `Session`/`JWT`/`User` —
  next-auth v5 re-exports those interfaces from `@auth/core/types`/`@auth/core/jwt` via
  `export type {...}`, which does not merge with an augmentation targeting `"next-auth"`
  itself (verified against the installed package).
- `service/requireRole.ts` — the first line of every `actions.ts` function across every
  module (`await requireRole("ADMIN" | "OPERATOR" | "VIEWER")`), independent of any layout
  or `src/proxy.ts` check, per CLAUDE.md invariant #5.
- `service/getCurrentUser.ts` — UX-only: the `(dashboard)/layout.tsx` redirect check and
  pages conditionally rendering mutation controls a `VIEWER` can't use.
- `src/proxy.ts` (Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`) —
  redirect-only: sends an anonymous visitor to `/login` and a signed-in one away from it.
  **Not the authorization boundary** — every action still calls `requireRole` itself.

Role policy: user/credential/proxy/policy mutations require `ADMIN`; run-triggering
actions (test connection, run now, cancel, retry) require `OPERATOR`; every dashboard page
is readable by any signed-in role, with mutation controls simply omitted below the
required role rather than the page itself being blocked.

Naming stays as originally planned: `User` = a person logging into *this app*;
`LinkedInAccount` = the scraped-from identity. Never conflate them.

---

## 6. Job queue: PostgreSQL only, no Redis

`modules/jobs` is a small, explicit queue engine. Postgres gives exactly the primitives
needed; the reason to avoid Redis here is not ideology, it is that the job rate is tiny
(tens per hour) while durability and auditability matter a great deal — the opposite of
Redis's strengths. The `Job` table itself is defined in `schema/jobs.prisma` (§4); this
section is the mechanics of using it correctly.

### 6.1 Claiming — `FOR UPDATE SKIP LOCKED`

This is the whole trick, and it is a single statement. Multiple workers can run it
concurrently with no coordination and no double-delivery:

```sql
UPDATE "Job" j
   SET status = 'RUNNING',
       "lockedBy" = $1,
       "lockedAt" = now(),
       "leaseExpiresAt" = now() + ($2 || ' seconds')::interval,
       attempts = attempts + 1
 WHERE j.id IN (
   SELECT id FROM "Job"
    WHERE status = 'QUEUED' AND "runAt" <= now() AND queue = $3
    ORDER BY priority ASC, "runAt" ASC
    LIMIT $4
    FOR UPDATE SKIP LOCKED
 )
RETURNING *;
```

Run it through `prisma.$queryRaw` in `server/db/raw/claimJobs.sql.ts`. Prisma's query API
cannot express `SKIP LOCKED`; that is expected and fine — this is the one place raw SQL
is the right answer. Keep all raw SQL in `server/db/raw/` so it is reviewable in one spot,
and remember every identifier needs double quotes — `"Job"`, `"runAt"` — since the
schema's PascalCase/camelCase names are not Postgres's default folding.

The index on `Job` is `[queue, status, priority, runAt]` — equality columns first, then
an order that matches `ORDER BY priority, runAt` exactly, so the planner needs no `Sort`
node before `LIMIT` applies. Verified with `EXPLAIN ANALYZE` against seeded rows: the
plan is a bare `Index Scan` with the `runAt <= now()` check folded into the `Index Cond`,
zero `Sort`. **Claim one queue at a time** (`queue = $3`, never `queue = ANY($3)`) — a
multi-queue `IN`/`ANY` predicate is no longer a pure equality match and the ordered-index
property collapses back into a sort; loop over the worker's configured queues instead.

### 6.2 Leases and crash recovery

A worker holds a **lease**, not a lock: `leaseExpiresAt` is extended by a heartbeat every
`LEASE_HEARTBEAT_MS` while the handler runs. The scheduler's **reaper** tick resets any
`RUNNING` job whose lease has expired back to `QUEUED` (or to `DEAD` if attempts are
exhausted), scanning the `[status, leaseExpiresAt]` index — `status` must lead, because
`leaseExpiresAt` is not cleared on completion and an unqualified index would be full of
stale values from finished jobs. Clear `lockedBy`/`lockedAt`/`leaseExpiresAt` on every
terminal transition to keep that live-lease region small. This is what makes a `kill -9`
mid-scrape safe. Leases must be generous: a `profile.scrape` job legitimately sleeps for
minutes, so `LEASE_SECONDS` is on the order of 15 minutes, with the heartbeat as the real
liveness signal.

### 6.3 Wakeup: `LISTEN`/`NOTIFY` with polling fallback

Polling alone is fine at this scale, but `NOTIFY` removes latency for user-triggered jobs
("Test connection", "Run now"): enqueue issues `NOTIFY jobs_<queue>` in the same
transaction as the insert; the worker holds **one dedicated, non-pooled `pg.Client`** for
`LISTEN` (a pooled connection cannot be used — this is the classic mistake), and treats a
notification purely as "wake up and try to claim," never as the job payload itself.
Regardless of notifications, poll every `POLL_INTERVAL_MS` **with jitter** so N workers do
not align — notifications are an optimization, correctness comes from polling.

### 6.4 Retries, backoff, dead letter

Exponential backoff with **full jitter**: `delay = random(0, min(cap, base * 2^attempt))`.
Classify errors in the handler, do not blanket-retry: `Retryable` (network blip, proxy
failure, timeout) → backoff and requeue; `Fatal` (selector no longer matches, malformed
payload) → `DEAD` immediately, because retrying a parsing failure 5 times just burns 5
page views against the quota; `RiskSignal` (checkpoint, authwall, 999) → **trip the
breaker** (§9), cancel the account's queued jobs, do not retry at all. `DEAD` jobs surface
on `/jobs` with the error and a manual "retry" action that **updates the row back to
`QUEUED`**, never inserts a new one — `idempotencyKey` is permanent, so a fresh insert
would hit the unique violation.

### 6.5 Concurrency control — the critical invariant

**One LinkedIn account = at most one browser session at any instant, across all
processes.** Two parallel sessions from one account is among the most reliable ways to
get flagged. Enforce it in the database, not in memory:

```sql
SELECT pg_try_advisory_lock(hashtext('li:acct:' || $1));
```

taken on the worker's dedicated connection for the lifetime of a browser-bound job, and
released in a `finally`. If the lock is not acquired, the job is pushed back with a short
delay — it is not an error. `WORKER_CONCURRENCY` then safely exceeds 1 only because jobs
for *different* accounts (and non-browser jobs like `lead.enrich`) can interleave.

### 6.6 Scheduler process

One `workers/scheduler.ts`, a single instance, ticking every ~30s: evaluate
`SearchDefinition.cron` (via `croner` — pure JS, no Redis) and enqueue due runs; reap
expired leases; atomically roll `RateBudget` windows (one conditional `UPDATE`, never
check-then-increment — see §9.4) and clear `cooldownUntil` where elapsed; re-activate
accounts whose cooldown ended, but never auto-reactivate a `RESTRICTED` one; prune
`JobLog`/`AuditEvent` past retention. It must be safe to run two copies briefly (during a
deploy), so guard each tick with `pg_try_advisory_lock('scheduler:tick')` and make
enqueues idempotent via `idempotencyKey` (e.g. `run:<searchId>:<yyyy-mm-ddThh>`).

### 6.7 Graceful shutdown

On `SIGTERM`/`SIGINT`: stop claiming → let in-flight handlers reach their next
cancellation checkpoint → `browser.close()` (always save `storageState` first, so
cookies survive and the next run does not need a fresh login) → release advisory locks →
requeue anything unfinished → close the Prisma client and the `LISTEN` client → exit.
Hard-exit after `SHUTDOWN_GRACE_MS`. Handlers receive an `AbortSignal` and check it
between steps, including inside `pacer.sleep()` — the signal is driven by
`Job.cancelRequestedAt`/`ScrapeRun.cancelRequestedAt`, which is how a "Cancel run" click
in the UI actually reaches a running browser.

---

## 7. The scraping pipeline

Many small, resumable jobs — never one long job per search. A crash, a restart, or a
breaker trip then costs one page view, and progress is durable in the database.

```
run.start ─┬→ session.ensure ──→ search.page.fetch (page 1)
           │                           │  upserts Lead stubs
           │                           ├→ profile.scrape × N   (one job per profile)
           │                           │        │
           │                           │        └→ lead.enrich (if website/domain found)
           │                           └→ search.page.fetch (page 2) … up to maxPages
           └────────────────────────────→ run.finalize
```

| Job type | Does | Notes |
| --- | --- | --- |
| `run.start` | validates policy, quota, active hours; creates `ScrapeRun`; enqueues `session.ensure` | cheap, no browser |
| `session.ensure` | loads sealed `storageState`, opens context, hits a cheap authenticated URL (e.g. `/feed/`); if logged out, performs credential login; re-seals cookies | the **only** job that may use the password; rare by design |
| `search.page.fetch` | one results page; extracts stubs (name, slug, headline, location); upserts `Lead` by `publicIdentifier`; enqueues `profile.scrape` per new lead + the next page | ~10 results per page |
| `profile.scrape` | one profile; opens contact-info panel if present; extracts website/email; writes a `LeadSnapshot` | the quota-consuming unit |
| `run.finalize` | aggregates counters, marks run `SUCCEEDED`, emits audit event; no-ops if the run is already terminal | avoids racing a `HALTED` run set by a risk signal |
| `search.typeahead.resolve` | resolves a label to a URN for `FilterRef`, async (invariant #1 forbids a live LinkedIn call from a Server Action) | plumbing done, endpoint UNVERIFIED — see §1 |
| `proxy.healthcheck` | periodic egress-IP check per proxy | no LinkedIn — **not yet implemented** |
| `lead.enrich` | no LinkedIn at all: fetch the lead's website, look for `mailto:`/contact page; optionally MX-validate | **not yet implemented** — deliberately deferred, see §1 |

Design notes:

- **Idempotency:** `idempotencyKey = "profile:<runId>:<publicIdentifier>"` so re-enqueueing
  is free and the reaper cannot double-scrape.
- **Re-parsing without re-scraping:** because every capture is stored as a `LeadSnapshot`
  (§4), a selector fix can be replayed offline with `pnpm reparse` (AGENTS.md §9) instead
  of re-scraping. This is the single highest-value decision in the pipeline — selector
  drift is constant, and re-scraping to fix a parser bug wastes irreplaceable quota.
- **Natural key:** `publicIdentifier` (the vanity slug) for the upsert, with
  `memberUrn` captured alongside it as the *stable* identity — members do change their
  vanity slug, and the URN is the only thing that survives that.
- Page objects in `scraper/pages/` do navigation and waiting; extractors in
  `scraper/extract/` are pure functions over HTML/serialized DOM, which is what makes
  them re-runnable over stored snapshots without ever touching LinkedIn again.
- All selectors live in `scraper/extract/selectors.ts`, each with a comment naming the
  date it was last verified; prefer stable attributes and text anchors over generated
  class names, and always provide a fallback chain. Expect to maintain this file forever.

---

## 8. Search filters

`SearchDefinition.filters` is `Json` in the database but a **zod-validated**
`SearchFilters` type in code (`modules/search/domain/filters.ts`); the builder UI, the
Server Action, and the URL constructor all share that one schema.

```ts
type SearchFilters = {
  keywords?: string;
  titles?: string[];            // current title
  locations?: GeoRef[];         // { label, urn } — urn resolved by a typeahead
  industries?: IndustryRef[];
  currentCompanies?: CompanyRef[];
  pastCompanies?: CompanyRef[];
  schools?: SchoolRef[];
  connectionDegree?: ("1" | "2" | "3+")[];
  serviceCategories?: string[];
  languages?: string[];
  openTo?: string[];
  sortBy?: "relevance" | "recent";
};
```

Why `{ label, urn }` pairs rather than plain strings: LinkedIn's people-search URL takes
opaque URNs (`geoUrn=["103644278"]`), so the UI must resolve a human label to a URN once
(via the typeahead, cached in the `FilterRef` table) and store both. A
`buildSearchUrl(filters, page)` function in `modules/search/domain/` owns the
query-string construction and is the one place LinkedIn's inevitable URL changes get
fixed — keep it pure and isolated.

**Implementation status:** `keywords`, `connectionDegree`, `locations`, and
`currentCompanies` are fully wired (`buildSearchUrl` emits real query params for them, the
UI's `TypeaheadPicker` resolves them against `FilterRef`). Every other field above
(`titles`, `industries`, `pastCompanies`, `schools`, `serviceCategories`,
`connectionsOf`/`followersOf`, `profileLanguages`, `openToVolunteering`) is present in the
zod schema and shape-validated, but shown disabled in the UI's "All filters" drawer and
silently ignored by `buildSearchUrl` if somehow populated — reserved so wiring one up
later is additive, never a breaking change to the stored JSON shape. The typeahead
resolution path itself (`search.typeahead.resolve`) is scaffolded but its LinkedIn-facing
endpoint is unverified — see §1.

---

## 9. Account-safety subsystem (`scraper/guards`)

Layered, and each layer is independently sufficient to stop work.

**1. Session reuse.** Credential login is the riskiest single action. Log in once, seal
`storageState`, reuse it for weeks, and re-login only when `session.ensure` proves the
cookies are dead. Never log in at the start of every run.

**2. Stable identity per account.** Generate a fingerprint *once* per `LinkedInAccount`
(UA matched to the actual bundled Chromium version, viewport, `locale`, `timezoneId`,
device scale) and persist it. A device that changes its screen size and timezone daily is
more anomalous than one that never does. For the same reason, pin a **sticky** proxy per
account, geographically consistent with where that account normally signs in — an account
that logs in from Dhaka and then appears in Ohio is a textbook flag. Never rotate the
proxy per request, and keep it one-account-per-proxy, enforced in the assignment service
(the schema allows sharing — `Proxy.proxyId` is not unique — because a non-deferrable
unique index would make a clean account-to-account proxy swap impossible mid-transaction;
surface "shared by N accounts" as a UI warning instead of a DB constraint).

**3. Pacing (`humanize/pacer.ts`).** Randomized delays everywhere, drawn from the policy
ranges in `ScrapingPolicy` (§4) — uniform jitter at minimum, preferably a long-tailed
distribution, since perfectly uniform randomness is itself a signature. Four nested
levels: between in-page steps (seconds), between profiles (tens of seconds to minutes),
between result pages (minutes), and a **session break** after `sessionBreakAfter`
profiles (10–45 minutes, browser closed).

Plus `activeHours.ts`: outside the account's local working hours, jobs are not retried —
they are rescheduled to the next window (`runAt = nextWindowStart`). A human does not
view 80 profiles at 03:40 local time. Weekends off by default. (`activeHoursStart/End`
are plain hour integers today and do not yet express an overnight wrap like 22→06 —
acceptable for now, worth revisiting before any account runs a night shift.)

**4. Quotas (`quota.ts`, `rateLimiter.ts`).** DB-backed token buckets in `RateBudget`, so
limits hold across restarts and across processes. Daily and weekly caps, checked *before*
navigation. The decrement is **one atomic conditional `UPDATE`**
(`SET consumed = consumed + 1 WHERE consumed < cap RETURNING consumed`, zero rows back
means over budget) — a check-then-increment from two workers is a lost-update race
against the one number that protects the account. Exceeding a cap pauses the run
(`PAUSED`, resumed by the scheduler tomorrow); it is not an error. Keep the defaults low —
the instinct to raise them is exactly what gets accounts restricted, which is why
`maxProfilesPerDay` also carries a hard DB-level ceiling (§4), not just an advisory one.

**5. Detection + circuit breaker (`session/detect.ts`, `guards/circuitBreaker.ts`).**
After every navigation, classify the response. Treat as a **risk signal**: a URL
containing `/checkpoint/`, `/authwall`, `/uas/login`, an HTTP `999`, a captcha/challenge
element, a "we've restricted your account" interstitial, an unexpected logout, or an
abnormal rate of empty result pages. On any risk signal:

```
save storageState → close browser → LinkedInAccount.status = CHALLENGED
  → cancel every QUEUED job for that account → ScrapeRun.status = HALTED
  → write AuditEvent + alert → require explicit human action to resume
```

**Never auto-retry through a challenge.** Retrying into a checkpoint converts a
recoverable warning into a permanent restriction. A human solves the challenge in a real
browser, then re-enables the account in the UI.

**6. Resource hygiene.** Block images/media/fonts at the route level (bandwidth and speed,
with no behavioral tell) but **do not** block scripts or XHR, and do not crudely patch
`navigator` properties — clumsy spoofing is more detectable than plain automation.
`playwright-extra` + stealth plugins are optional at best: maintenance burden, target
fingerprint checks rather than behavioral ones, and their signatures are themselves
known. Prefer a persistent context, an honest fingerprint, real cookies, and slow human
pacing — which is what actually matters here. If higher fidelity is needed, run headed
Chromium under Xvfb rather than layering patches.

**7. Blast-radius limits.** Scale by adding accounts, never by raising per-account
concurrency. Consider a dedicated account you can afford to lose; never the company's
primary one.

---

## 10. Configuration

`server/config/env.ts` parses `process.env` with zod at boot and exports a typed, frozen
object. **Nothing else in the codebase reads `process.env`.** The process fails fast and
loudly on a bad or missing variable — `dotenv` silently giving `undefined` to a browser
launcher is a bad afternoon.

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | both | Postgres connection (present) |
| `APP_URL`, `AUTH_URL`, `NEXTAUTH_URL` | web | base URLs (present) |
| `AUTH_SECRET`, `AUTH_TRUST_HOST` | web | NextAuth (present) |
| `ENCRYPTION_KEY` | both | base64 32 bytes, AES-256-GCM master key — optional at the schema level (queue-only code never seals anything) but `server/crypto/secretBox.ts` throws its own clear error the moment something tries to seal/unseal without it |
| `LINKEDIN_EMAIL`, `LINKEDIN_PASSWORD` | worker | present in `.env`; **bootstrap/dev only** — see below |
| `USE_PROXY` | worker | master on/off for proxying |
| `PROXY_URL` | worker | single-proxy shortcut, e.g. `http://user:pass@host:port` |
| `PROXY_COUNTRY` | worker | geo hint for pool selection |
| `HEADLESS` | worker | `true` in prod; `false` for local debugging |
| `WORKER_ID`, `WORKER_CONCURRENCY`, `WORKER_QUEUES` | worker | identity + parallelism — `WORKER_ID` defaults to `worker-<pid>` if unset, so a quick manual run doesn't need it, though a real deployment should set one explicitly per process |
| `POLL_INTERVAL_MS`, `LEASE_SECONDS`, `LEASE_HEARTBEAT_MS`, `SHUTDOWN_GRACE_MS` | worker | queue timing |
| `SCRAPER_*_DELAY_*_MS`, `MAX_PROFILES_PER_DAY`, `ACTIVE_HOURS_*` | worker | global pacing defaults — `ScrapingPolicy` rows are per-account overrides of these, never the other way around |
| `LOG_LEVEL`, `NODE_ENV`, `TZ=UTC` | both | pin the process timezone explicitly, in addition to every `DateTime` column being `timestamptz` |

**`.env` credentials vs. the config page.** `.env` holds `LINKEDIN_EMAIL` /
`LINKEDIN_PASSWORD` today, which is the right way to bootstrap before the UI exists. It
is not the production mechanism: the system must support multiple accounts, rotation,
per-account status and fingerprint, and an audit trail — none of which fit in env vars.
Target behavior: `db:seed` imports the `.env` pair into a `LinkedInAccount` row (sealed)
if none exists, and from then on the **database is the only source of truth**, managed
from `/config`. Keep the env vars as a dev convenience; do not read them from
application code paths.

**`USE_PROXY` semantics.** `USE_PROXY=false` → `launch()` receives no `proxy` option at
all (not an empty object). `USE_PROXY=true` → resolve in order: the account's assigned
`Proxy` row → `PROXY_URL` → **fail the job**. Silently falling back to the datacenter IP
when a proxy is misconfigured is the worst possible outcome, because it exposes the real
egress IP precisely when you believed you were hidden. Fail loudly instead. Proxy
passwords are sealed in the DB and decrypted only in the worker.

---

## 11. Packages

Installed (`pnpm add`): `zod`, `pg`, `pino`, `croner`, `date-fns`, `@date-fns/tz`, `clsx`,
`tailwind-merge`, `class-variance-authority`, `cheerio` (added at stage 4 of §13 —
`scraper/extract/profile.extract.ts` is a pure `(html: string) => fields` function per the
write-extractor skill's "replayable offline against stored evidence" design, which is
structurally impossible without an HTML-string parser; `page.evaluate()` only ever works
against a *live* Playwright page). Installed as dev dependencies
(`pnpm add -D`): `playwright` (worker-only — never imported by the web app, and the
standalone build must not try to bundle it), `tailwindcss`, `@tailwindcss/postcss`,
`postcss`, `@types/pg`, `pino-pretty`. After install: `pnpm exec playwright install
--with-deps chromium` to actually fetch the browser (deferred until stage 4 of §13 — it
downloads ~150MB and needs sudo for system libs).

Installed for auth: `next-auth@beta` (resolved to `5.0.0-beta.32` — plain `next-auth`
without the `@beta` tag installs v4, which has a materially different API), `@auth/prisma-adapter`, `bcryptjs`. `@types/bcryptjs` was added then removed — bcryptjs
ships its own type definitions and the stub package is deprecated. Deferred to when the
enrichment queue exists: `p-limit`.

**No test library, by decision.** No `vitest`, no `@playwright/test`, no coverage
tooling, no `tests/` directory anywhere in this project. The cost is real: the
`scraper/extract/` parsers have no automated safety net, and LinkedIn changes its markup
on its own schedule. What partially compensates: `pnpm reparse` (AGENTS.md §9) replays
the current extractors over stored `LeadSnapshot` rows and diffs the result against the
saved `Lead`, without a framework and without touching LinkedIn; and the `/verify`
command's static checks (lint, typecheck, `prisma validate`, `next build`) are the entire
automated gate.

**No `@tanstack/react-table`, by decision.** The leads grid is a server-rendered table
driven by `searchParams` — sort/filter/page live in the URL, the Server Component queries
Prisma with `orderBy`/`where`/`skip`/`take`, row markup is a plain `<table>`. That keeps
it a pure RSC (no client bundle, no hydration of thousands of rows), makes every view a
shareable link, and fits inside the ≤150-line component budget (AGENTS.md §4.1) without a
headless-grid abstraction. Row-selection-for-export becomes a small client island, not a
grid framework.

Ops: Docker on `mcr.microsoft.com/playwright:v1.x-jammy` (ships the browser's system
deps); `pm2` or systemd units for `worker` and `scheduler`; `xvfb` only if running headed.

Deliberately **not** used: Redis, BullMQ, Temporal, Kafka, Puppeteer (Playwright
instead), any paid scraping API, and ORM-level raw-SQL escape hatches outside
`server/db/raw/`.

---

## 12. Runtime topology

```
┌──────────────┐      ┌────────────────────────────┐      ┌──────────────┐
│ Next.js app  │      │       PostgreSQL           │      │  worker × N  │
│ (standalone) ├─────►│  data + Job queue          │◄─────┤  Playwright  │
│ RSC + actions│ NOTIFY│  + advisory locks         │LISTEN│  + proxy     │
└──────────────┘      └──────────┬─────────────────┘      └──────┬───────┘
                                 │                               │
                          ┌──────┴───────┐                  ┌────┴────┐
                          │ scheduler ×1 │                  │ LinkedIn│
                          │ cron + reaper│                  │ websites│
                          └──────────────┘                  └─────────┘
```

Three process types, one database, no broker. The web app is stateless and horizontally
scalable. Workers are stateful-ish (they own browsers) and scale per LinkedIn account,
not per CPU. The scheduler is a singleton (guarded by an advisory lock so a rolling
deploy is safe). Deployment must keep workers **off serverless** — a long-lived browser
process is incompatible with request-scoped runtimes; run workers on a VM or container
with persistent disk for the browser profile. `prisma.compute.ts` targets the Next.js app
only — the workers need separate hosting.

Observability: `/api/health` reports DB reachability plus worker-heartbeat freshness; the
dashboard surfaces queue depth, dead-letter count, per-account quota burn-down and status,
and selector-failure rate (the leading indicator of LinkedIn markup changes). Alert on:
breaker trip, any `CHALLENGED`/`RESTRICTED` account, dead-letter growth, stale heartbeat,
selector-failure spike.

---

## 13. Build order

1. **Foundations** — `server/config/env.ts`; `server/logger`; `server/crypto/secretBox.ts`;
   move `src/lib/prisma.ts` → `server/db/prisma.ts`; fix the `@/*` alias. (Schema, deps,
   Tailwind wiring, and the agent harness are already done.)
2. **Queue engine** — `enqueue`/`claim`/`complete`/`fail`; backoff; reaper;
   `workers/worker.ts` with a trivial `noop` handler; graceful shutdown; verify against
   real Postgres. *Do not touch Playwright yet — a queue with browsers wired in is very
   hard to debug.*
3. **Config surface** — `/config` pages with Server Actions; sealed writes; seed-import
   of the `.env` credentials into `LinkedInAccount`.
4. **Session** — browser launch + proxy + fingerprint; `session.ensure` handler;
   `storageState` seal/unseal; detection; breaker. Milestone: "Test connection" goes
   green from the UI without the web process ever opening a browser.
5. **Search** — filter schema + builder UI + `buildSearchUrl`; `search.page.fetch`;
   lead stub upsert. Guards active from the first navigation, not retrofitted.
6. **Profiles** — `profile.scrape`, contact-info panel, extractors, `LeadSnapshot`
   storage, the `pnpm reparse` check.
7. **Enrichment + export** — `lead.enrich`, email confidence model, CSV export, retention.
8. **Auth** — NextAuth, RBAC, audit events on every mutation.
9. **Hardening** — dashboards, alerts, runbook, Docker + process supervision, backups.

Stage 2 has no LinkedIn dependency at all and is where the queue architecture is actually
proven. Resist starting at stage 4. Because the schema is already one complete migration
rather than built up stage-by-stage, stages 2–9 are code-only milestones now, not
migration boundaries — there is no "the Job table doesn't exist yet" problem to work
around.

**Deviation, recorded rather than silently reordered:** stage 8 (Auth) was pulled forward
and built in the same pass as stages 3 (Config), 5 (Search), and most of 6 (Profiles), at
the user's explicit request — they wanted a working login/dashboard/user-management
surface before anything else, not after the scraping pipeline. `lead.enrich` (part of
stage 7) and `croner`-based cron evaluation (part of stage 9's scheduler work) remain
undone; stage 9's dashboards/alerts/runbook/Docker hardening is otherwise still ahead.
