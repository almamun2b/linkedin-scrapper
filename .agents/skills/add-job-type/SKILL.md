---
name: add-job-type
description: Add a new job type to this project's Postgres-backed queue — payload schema, handler, registration, idempotency key, error classification, lease sizing. Use when adding or changing a src/workers/handlers/*.ts job, a new "verb.noun" job type (e.g. profile.scrape, lead.enrich), or anything that enqueues work for the worker to process.
metadata:
  project: linkedin-scrapper
---

# Add a job type

This project has no Redis and no job-queue library — `Job` is a Postgres table, claimed
with `FOR UPDATE SKIP LOCKED` (ARCHITECTURE.md §6). Every job type added to it inherits
the same invariants; skipping one of these steps is how a job type silently breaks the
reaper, the dead-letter flow, or the account's quota.

## Steps

1. **Name it `verb.noun`, dotted and namespaced** (`profile.scrape`, `search.page.fetch`,
   `lead.enrich`), matching the existing types in ARCHITECTURE.md §7. `Job.type` is a
   plain `String`, not a Prisma enum — job types are added too often for a migration per
   type, so there is nothing to regenerate here.

2. **Define the payload schema** in `src/modules/jobs/domain/` as a zod schema, one file
   per job type or grouped by queue. The handler parses `job.payload` through it on entry
   — `Job.payload` is `Json` in the database, so nothing upstream can be trusted as typed.

3. **Write the handler** in `src/workers/handlers/<type>.ts`, ≤100 lines (CLAUDE.md size
   budget — if it's longer, the job is doing too much; split it into two job types that
   chain, which is also more resumable). A handler:
   - receives the parsed payload and an `AbortSignal`
   - checks the signal between every await, including inside any `pacer.sleep()` call —
     this is what makes `ScrapeRun.cancelRequestedAt`/`Job.cancelRequestedAt` actually stop
     a running browser (ARCHITECTURE.md §6.7)
   - if it touches a `LinkedInAccount` at all, takes the advisory lock first
     (`pg_try_advisory_lock(hashtext('li:acct:' || id))`) and pushes the job back with a
     short delay if it can't get it — never proceeds without the lock, and never treats a
     failed acquisition as an error
   - throws a **classified** error, not a bare `Error`:
     - `RetryableError` — network blip, proxy failure, timeout → backoff and requeue
     - `FatalError` — selector no longer matches, malformed payload → `DEAD` immediately;
       retrying a parsing bug just burns irreplaceable page views
     - `RiskSignalError` — checkpoint, authwall, HTTP 999, captcha → trips the circuit
       breaker (ARCHITECTURE.md §9.5), cancels the account's queued jobs, never retries

4. **Register the handler** wherever `workers/worker.ts` dispatches by `job.type` (a
   lookup map keyed by the dotted type string, not a switch that grows forever).

5. **Pick an `idempotencyKey` convention** for this job type and write it down as a
   comment next to the enqueue call — e.g. `profile:<runId>:<publicIdentifier>`. The key
   is permanent (`Job.idempotencyKey` is `@unique`, and Postgres treats `NULL` as distinct
   so unkeyed jobs never collide with it), so:
   - enqueue with `createMany({ data: [job], skipDuplicates: true })` or catch `P2002` —
     never read-then-insert, which races two scheduler instances during a deploy
   - a manual retry from `/jobs` must `UPDATE` the existing `DEAD` row back to `QUEUED`,
     never insert a new row with the same key — an insert hits the unique violation

6. **Size the lease.** `LEASE_SECONDS` must comfortably exceed this job's worst-case
   sleep time (a `profile.scrape` job that pauses for 90s between steps needs a lease in
   the 10+ minute range, not the default). If it runs long, make sure the handler's
   heartbeat actually extends `leaseExpiresAt` — a job that outlives its lease gets reaped
   and double-run.

7. **If this job spends LinkedIn quota** (anything that navigates a LinkedIn URL), wire it
   through `quota.ts`'s atomic `RateBudget` decrement *before* navigation, not after. A
   job that checks quota after the page load has already spent the view it was supposed
   to refuse.

8. **Verify for real**, per AGENTS.md §2: run the worker against local Postgres, enqueue
   one job of the new type, and inspect the `Job`/`JobLog` rows it produces — there is no
   test suite to do this for you.

## Checklist before calling it done

- [ ] Payload schema in `modules/jobs/domain/`, parsed on handler entry
- [ ] Handler ≤100 lines, checks `AbortSignal` between steps
- [ ] Advisory lock taken if the job touches a `LinkedInAccount`
- [ ] Errors thrown as `RetryableError` / `FatalError` / `RiskSignalError`, never bare
- [ ] `idempotencyKey` convention chosen and documented at the enqueue call
- [ ] Lease duration checked against worst-case sleep time
- [ ] Quota checked before navigation, if this job touches LinkedIn
- [ ] Run against real Postgres and the resulting rows inspected
