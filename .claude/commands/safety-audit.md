---
description: Grep the tree for the specific architectural/safety violations listed in AGENTS.md §8 — not a substitute for code review, a fast net for the easy-to-miss ones.
---

Run each check below from the repository root and report every match plainly — a match is
not automatically a problem, but every one needs a one-line justification or a fix; don't
silently wave one through. If a directory referenced below doesn't exist yet (most of
`src/modules`, `src/server`, `src/scraper`, `src/workers` don't, as of the current build
stage — ARCHITECTURE.md §13), say so and skip that check rather than reporting a false
"clean."

**1. Playwright reachable from a request path** (CLAUDE.md invariant #1):
```bash
grep -rln "from ['\"]playwright" src/app src/modules 2>/dev/null
```
Any hit is a violation — Playwright may only be imported from `src/scraper/` and
`src/workers/`.

**2. Prisma imported outside a repository file** (CLAUDE.md invariant #6, AGENTS.md §3):
```bash
grep -rln "from ['\"].*generated/prisma\|from ['\"]@prisma/client" src/modules --include="*.ts" 2>/dev/null | grep -v "/repository/"
```
Any hit outside a `repository/` directory is a violation.

**3. `process.env` read outside the single config module** (ARCHITECTURE.md §10):
```bash
grep -rln "process\.env" src --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "server/config/env.ts\|^src/generated/prisma/"
```
`src/generated/prisma/**` is excluded — that's Prisma's own generated runtime, not
hand-written code. **`src/lib/prisma.ts` is a known, accepted exception, not a new
violation**: it predates `server/config/env.ts` and moves to `server/db/prisma.ts` at
build-order stage 1 (ARCHITECTURE.md §13) — don't flag it until that stage has landed and
the config module actually exists. Once `server/config/env.ts` exists, every other hit is
a real violation.

**4. Raw SQL outside `server/db/raw/`** (CLAUDE.md invariant #6):
```bash
grep -rln '\$queryRaw\|\$executeRaw' src --include="*.ts" 2>/dev/null \
  | grep -v "server/db/raw/\|^src/generated/prisma/"
```
`src/generated/prisma/**` is excluded for the same reason as check 3. Any other hit is a
violation — raw SQL is reviewable only if it lives in one place.

**5. A hardcoded LinkedIn URL outside the scraper** (CLAUDE.md invariant #10, AGENTS.md §5):
```bash
grep -rln "linkedin\.com" . --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git 2>/dev/null \
  | grep -v "^src/scraper/"
```
Deliberately **code only** (`.ts`/`.tsx`), not `.md` — the project's own docs and skills
(this one included) mention "linkedin.com" in prose to warn against it, which is not a
violation. Any hit in actual code outside `src/scraper/` is one — including in a script,
example, or debug utility; there is no fixture corpus or test suite to exempt it.

Summarize as a short pass/fail list per check, not a wall of grep output.
