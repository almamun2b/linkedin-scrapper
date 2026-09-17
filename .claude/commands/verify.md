---
description: Run the Definition-of-Done gate (AGENTS.md §6) — lint, typecheck, schema validation, production build.
---

Run these four checks in order, from the repository root. This project has no test
library by decision (CLAUDE.md), so these four plus a manual run of whatever was changed
are the entire automated gate — do not treat "no test suite" as "nothing to run."

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm exec prisma validate`
4. `pnpm build`

Report each command's result individually — which passed, which failed, and the actual
output for any failure. Do not summarize as "all clean" without having run every one of
them in this turn. If a step was skipped (e.g. no `prisma/schema/` changes to validate,
though `prisma validate` is cheap enough to always run), say so explicitly rather than
implying it passed.

If anything in the diff touches a job handler, the queue, or the scraper, also say plainly
whether it was exercised against a real local Postgres / a real worker run — `/verify`'s
four checks are static and cannot prove queue semantics (`SKIP LOCKED`, lease expiry,
advisory locks) or scraper behavior on their own (AGENTS.md §2 step 5).
