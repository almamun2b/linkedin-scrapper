/**
 * One-sentence purpose for every editable field on `/config/policy` and `/config/system` —
 * the source both the hover-help tooltip (`Field`'s `help` prop) and `docs/configuration.md`
 * read from, so the two can never say something different.
 */
export const SCRAPING_POLICY_HELP = {
  stepDelayMinMs: "Shortest pause between small actions on a page (typing, clicking). Pacing is the safety mechanism — never shortened, even while debugging.",
  stepDelayMaxMs: "Longest pause between small actions. Picked randomly between min and max each time.",
  profileDelayMinMs: "Shortest pause before opening the next profile in a search.",
  profileDelayMaxMs: "Longest pause before opening the next profile.",
  pageDelayMinMs: "Shortest pause before loading the next page of search results.",
  pageDelayMaxMs: "Longest pause before loading the next page of search results.",
  sessionBreakAfter: "How many profiles to scrape before taking a longer session break.",
  sessionBreakMinMs: "Shortest length of that session break.",
  sessionBreakMaxMs: "Longest length of that session break.",
  maxProfilesPerDay: "Hard ceiling on profiles scraped per account per day, enforced atomically by the queue — a job fails rather than exceed it.",
  maxSearchPagesPerDay: "Hard ceiling on search-result pages fetched per account per day.",
  maxProfilesPerWeek: "Hard ceiling on profiles scraped per account per rolling week.",
  activeHoursStart: "Scraping only runs at or after this hour, in each account's own timezone — not the server's.",
  activeHoursEnd: "Scraping stops at this hour. Does not yet express an overnight window (e.g. 22→06).",
  activeOnWeekends: "When off, no scraping jobs run on Saturday or Sunday in the account's local time.",
  useProxy: "When on, a job fails if no proxy resolves for the account — it never falls back to your real IP.",
  headless: "Run the browser without a visible window. Turn off only for local debugging.",
  fallbackProxyUrl: "Used only when an account has no Proxy of its own assigned. Format: protocol://user:pass@host:port. Leave blank to require every account to have its own assigned proxy.",
  proxyCountry: "Geo hint for future proxy-pool selection — not yet consulted by any code.",
} as const;

export const SYSTEM_SETTING_HELP = {
  workerId: "Default identity for a `pnpm worker` process. A second worker process overrides this with a --worker-id flag rather than sharing it.",
  workerConcurrency: "How many jobs one worker process may run at the same time. Jobs for the same LinkedIn account never run concurrently regardless of this value — only jobs for different accounts, or non-browser jobs, interleave.",
  workerQueues: "Comma-separated queue names this worker claims jobs from.",
  pollIntervalMs: "How often an idle worker checks the queue for new work.",
  leaseSeconds: "How long a worker may hold a claimed job before the scheduler assumes it crashed and requeues it. Must exceed your slowest job's real duration.",
  leaseHeartbeatMs: "How often a running worker renews its heartbeat row, so other processes can tell it's still alive.",
  shutdownGraceMs: "How long a worker waits for in-flight jobs to finish on shutdown before force-exiting.",
  logLevel: "Minimum severity written to logs: fatal, error, warn, info, debug, or trace.",
  displayTimezone: "IANA timezone used for dashboard timestamps and as the default for newly created LinkedIn accounts.",
} as const;
