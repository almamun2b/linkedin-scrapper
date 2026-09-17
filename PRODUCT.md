# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A single solo operator — the same person who configures LinkedIn accounts and proxies
also defines searches and reviews the resulting leads. No multi-user roles, team
permissions, or client-facing access are in scope. The operator is technical enough to
manage self-hosted infrastructure (this is a self-hosted app they run themselves).

## Product Purpose

Turn structured LinkedIn people-search filters into an outbound-sales lead list: name,
website, and email per person. Success is a usable prospecting list landing in `Lead`
rows that the operator can act on directly (outreach), not a general research corpus.

## Positioning

Self-hosted LinkedIn extraction built around *survivability*, not raw throughput: a
Postgres-backed job queue, one live session per LinkedIn account enforced by an advisory
lock, and a hard circuit breaker on any challenge/authwall — instead of a naive scraper
that maximizes short-term volume and burns the account. A neighboring "just scrape fast"
tool could not truthfully copy this positioning, since account survival (not scrape
speed) is the throughput ceiling by design (see ARCHITECTURE.md §0).

## Operating Context

- Three long-running process types share one Postgres database and nothing else (no
  Redis/broker): the Next.js web app (UI + Server Actions, never touches LinkedIn), a
  worker pool (owns Playwright browsers, claims jobs from the queue), and a singleton
  scheduler (cron ticks, lease reaping, quota rollover).
- The operator's actual workflow: configure a LinkedIn account + proxy in `/config`,
  define a search with filters, let the queue run `session.ensure → search.page.fetch →
  profile.scrape → run.finalize` over time (deliberately slow, paced across
  minutes/hours, not a batch job that finishes in one sitting), then review results in
  `/leads`, `/runs`, and `/jobs`.
- Throughput is capped by the LinkedIn account's daily human-plausible activity budget,
  not by hardware — scaling means adding more accounts/proxies, never raising
  per-account concurrency.
- Email yield directly from LinkedIn profiles is inherently low (single-digit
  percentages — only 1st-degree connections or members who published one publicly);
  most real email addresses are expected to come from a later `lead.enrich` stage
  (website/company-domain resolution), not from `profile.scrape` itself.
- A challenge (`/checkpoint/`, authwall, HTTP 999, captcha) is a hard stop: the account
  is marked `CHALLENGED`, its queued jobs are cancelled, and a human must intervene —
  never auto-retried.

## Capabilities and Constraints

- Confirmed functionality (implemented per ARCHITECTURE.md §1): LinkedIn account
  bootstrap, `/config` UI (accounts, proxies, scraping policy, read-only system tab),
  auth (NextAuth, login page, dashboard layout), the search module (filter builder,
  `SearchDefinition`/`ScrapeRun`/`FilterRef`), the `run.start → session.ensure →
  search.page.fetch → profile.scrape → run.finalize` job chain, the `lead` module, and
  the `/jobs` dashboard.
- Not yet implemented: `croner`-based cron scheduling (currently reaper-only),
  `lead.enrich` (website-visit email enrichment), and a confirmed
  `search.typeahead.resolve` handler — its plumbing exists but the actual LinkedIn
  typeahead endpoint/selectors are unverified by design, since no agent may probe live
  linkedin.com to find them (CLAUDE.md invariant #10). Until a human supplies that
  endpoint from their own browser devtools, Location/Current-company pickers only work
  from whatever `FilterRef` rows already exist.
- Automated collection violates the LinkedIn User Agreement; the account can be
  restricted or closed at LinkedIn's sole discretion regardless of care taken. Never
  describe any configuration in this product as "safe" or "zero risk" — the
  architecture reduces and contains risk, it does not eliminate it.
- No test library is installed, by deliberate decision (CLAUDE.md invariant #10) — this
  is a durable constraint on how correctness gets verified in this project, not a gap
  to fill.

## Brand Commitments

None. Functional/internal-tool styling only — no product name, logo, or visual identity
is binding. "linkedin-scrapper" (the repo/package name) is a working title, not a brand.

## Evidence on Hand

None. No real leads, screenshots, testimonials, or sample data exist yet to reference or
display; do not fabricate example leads, companies, or people beyond obvious placeholder
data clearly marked as such.

## Product Principles

1. **Account survival outranks scrape volume.** Every UI and workflow decision should
   make the paced, resumable nature of scraping legible to the operator, not hide it
   behind a "just click go" abstraction that implies instant results.
2. **The operator is the only user — optimize for their operational clarity, not
   onboarding strangers.** Dense, information-forward admin/ops UI beats marketing-style
   simplification; this is a tool the same person configures and reads daily.
3. **Never imply certainty the data doesn't have.** Low/variable email yield,
   `emailSource`/`emailConfidence`, job/run states, and account health (including
   `CHALLENGED`) must be visible and honestly represented, not smoothed over.
4. **Risk and limits are shown, not hidden.** Account risk, quota consumption, and
   circuit-breaker state are core information the operator needs to see at a glance, not
   details buried in a settings page.
5. **Slow is a feature.** Delays, pacing, and multi-hour run durations are the safety
   mechanism (CLAUDE.md invariant #8) — the UI should present long-running runs/jobs as
   normal and expected, never as something broken that needs a spinner apology.
