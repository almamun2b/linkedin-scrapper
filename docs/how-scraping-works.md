# How scraping works

## The short version

You never click a button that opens a browser. Every button on this dashboard does one
thing: insert a row into a `Job` table in Postgres. A separate `pnpm worker` process,
running continuously, is the only thing that ever opens a real browser, and it does so
slowly, on purpose, with long random pauses between actions.

```
you click "Run" ──▶ a Job row is inserted ──▶ (nothing visible happens yet)
                                                       │
                          the worker process polls the queue, sooner or later claims it
                                                       │
                          opens Playwright, logs in if needed, navigates, waits, extracts
                                                       │
                          writes results to the database, enqueues the next step
```

A run can take minutes to hours. That's deliberate — see "Why so slow?" below.

## The pipeline, step by step

Starting a search enqueues a chain of small jobs, each one resumable on its own:

```
run.start ─┬→ session.ensure ──→ search.page.fetch (page 1)
           │                           │  creates a Lead stub per result
           │                           ├→ profile.scrape × N   (one job per profile)
           │                           └→ search.page.fetch (page 2) … up to maxPages
           └────────────────────────────→ run.finalize
```

| Job | What it does |
| --- | --- |
| `run.start` | Checks quota and active hours, creates the `ScrapeRun` row, kicks off `session.ensure`. No browser. |
| `session.ensure` | Opens a browser with your account's saved cookies, checks you're still logged in. Only logs in with the password if the saved session is dead — this is the *only* job that ever touches your password, and it should run rarely. |
| `search.page.fetch` | Loads one page of search results (~10 people), creates a `Lead` stub for each new person, queues a `profile.scrape` job per lead and the next results page. |
| `profile.scrape` | Visits one profile, opens the contact-info panel if present, saves everything it saw. This is the step that consumes your daily quota. |
| `run.finalize` | Totals everything up and marks the run finished. |

Every profile visit is saved as a `LeadSnapshot` — a gzipped copy of the raw HTML — before
it's parsed into fields. If the site's markup changes and a name or email starts coming
back empty, that's a parser bug, not a reason to re-scrape: run `pnpm reparse` and every
saved snapshot gets re-parsed with the fixed logic, for free. Re-scraping instead would
burn quota that a real LinkedIn account gets back only slowly, if ever.

## Why so slow? The safety mechanisms

Everything below exists because the LinkedIn account is the one thing this system cannot
replace once it's gone. Turning any of it down "just to test faster" is turning the safety
system off.

- **Session reuse.** Logging in is the single riskiest action, so it happens as rarely as
  possible — the saved cookies are reused for as long as they keep working.
- **A stable fingerprint.** Each account keeps the same browser identity (user agent,
  screen size, locale, timezone) forever. A device that looks different every day is
  itself a red flag.
- **Pacing.** Random pauses between every action — seconds between clicks, tens of seconds
  to minutes between profiles, minutes between result pages, and a longer break (10–45
  min) every dozen or so profiles. All of this is configurable at `/config/policy` — see
  [configuration.md](configuration.md) — but never in the direction of "faster."
- **Active hours.** Scraping only happens during a configured local-time window (default
  9am–6pm, weekdays), evaluated in *the account's own timezone*. Outside that window a job
  isn't retried — it's rescheduled to the next window.
- **Quotas.** Hard daily/weekly caps on profiles and search pages, enforced in the
  database so they survive a restart. Hitting a cap pauses the run rather than erroring;
  it resumes on its own the next day.
- **The circuit breaker.** After every navigation, the worker checks the page for a
  challenge, an auth wall, a login redirect, an HTTP 999, or a captcha. Any of these trips
  the breaker immediately:

  ```
  save the session → close the browser → mark the account CHALLENGED
    → cancel every other queued job for that account → require a human to look
  ```

  **It never retries through a challenge.** Retrying turns a warning into a permanent
  restriction. A human has to sign in through a real browser, resolve whatever LinkedIn is
  asking for, and re-enable the account from `/config/accounts`.

## Troubleshooting

### "I clicked Run / Test connection and nothing is happening"

Check, in order:

1. **Is a worker actually running?** Every action here only inserts a `Job` row — nothing
   processes it without a running `pnpm worker` (or `pnpm worker:dev`) process. This is
   the single most common cause of "nothing happens." The dashboard does not currently
   show worker liveness on any page, so check your terminal / process list directly.
2. **Is it outside active hours?** Look at the job on `/jobs` — if it's `QUEUED` with a
   `runAt` in the future rather than now, it's parked until the account's active-hours
   window opens (`/config/policy`). A **Test connection** click is the one exception: it
   bypasses the active-hours check on purpose, since a deliberate admin click isn't the
   automated behavior that gate exists for. If a *regular* run is stuck, either wait, or
   use **Run now** on `/jobs` to force it — sparingly, since that's still using real quota
   outside the hours you configured for a reason.
3. **Is the account already `CHALLENGED` or `RESTRICTED`?** Check `/config/accounts` — a
   tripped breaker cancels all of that account's other queued jobs until a human
   re-enables it.

### "Test connection failed" / a `session.ensure` job is `DEAD`

The error message on `/jobs` now includes the actual URL LinkedIn sent the browser to
(e.g. `login_redirect (https://www.linkedin.com/uas/login?...)`), and — when the failure
was a risk signal — the job also has a screenshot and the page's HTML attached
(`JobArtifact` rows, viewable by expanding the job row). This exists specifically so you
don't have to burn another login attempt to find out what happened. Use it to tell apart:

- **A real LinkedIn challenge or captcha** — the screenshot will show one. Nothing to fix
  in code; a human needs to sign in through a real browser and resolve it, then re-enable
  the account.
- **A plain login page** — the screenshot shows LinkedIn's ordinary sign-in form, not a
  challenge. This usually means the login attempt itself didn't succeed: double-check the
  password saved for the account (rotate it from `/config/accounts` if unsure), and
  consider whether the account's fingerprint/proxy combination looks unusual enough that
  LinkedIn silently rejected an automated-looking sign-in without showing a captcha.
- **A logged-in feed page** — if the screenshot actually shows the feed, the failure was a
  **stale selector**, not a real problem: `SELECTORS.feed.globalNav` in
  `src/scraper/extract/selectors.ts` no longer matches LinkedIn's current markup. Fix the
  selector (adding a fallback, not replacing the old one — see the `write-extractor`
  skill) rather than touching the login flow.

`login_redirect` specifically means: the login form was submitted, the browser ended up
back on `/feed/`, but none of `SELECTORS.feed.globalNav`'s fallbacks matched — which is
exactly the ambiguity the screenshot resolves.

### A job keeps losing an attempt without ever running

Rescheduling a job for later (outside active hours, an account lock briefly held by
another job) is not supposed to count as a failed attempt — but the queue's claim step
always increments `attempts` the moment a job is claimed, before any handler runs. This is
now compensated for (`rescheduleTo` decrements `attempts` back), so a job parked by active
hours no longer creeps toward `maxAttempts` just by waiting. If you see a job with a high
`attempts` count that has never actually run (no `lastError`, no artifacts), that's the
signal something is stuck reclaiming it — check the reaper (`pnpm scheduler`) is running.
