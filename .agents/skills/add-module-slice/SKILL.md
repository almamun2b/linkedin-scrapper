---
name: add-module-slice
description: Scaffold a new feature slice under src/modules/ — domain/service/repository/actions.ts/ui, the dependency rule between them, and the thin-Server-Action shape this project enforces. Use when starting a new module (linkedin-account, proxy, policy, search, run, lead, jobs, audit) or any new top-level feature area.
metadata:
  project: linkedin-scrapper
---

# Add a module slice

Application logic lives in `src/modules/<slice>/`, one directory per bounded concept
(ARCHITECTURE.md §2.1, §3). Every slice has the same internal shape, and the shape exists
to keep one invariant true: **a Server Action is routing, not logic.**

## Layout

```
src/modules/<slice>/
  domain/        # types, zod schemas, pure rules — no I/O, no Prisma, no fetch
  service/       # use cases: orchestration, transactions, calls into repository/
  repository/    # the ONLY place this slice imports `prisma`
  actions.ts     # "use server" — authorize → zod-parse → call service → revalidatePath
  ui/            # components owned by this slice
```

Dependency direction within the slice mirrors the project-wide rule: `actions.ts` → 
`service/` → `repository/` → `domain/`. Nothing below calls up. `ui/` may call `domain/`
for pure formatting/validation but never `repository/` directly.

## Steps

1. **Start with `domain/`.** Write the zod schema for whatever this slice validates, and
   any pure functions (no I/O) the slice needs. This is the layer that's cheapest to get
   right first and most expensive to retrofit.
2. **`repository/`** — thin Prisma wrappers, named by what they return
   (`findActiveByAccount`, not `getData`). This is the *only* file in the slice allowed to
   `import { prisma }`. If the slice touches sealed columns (`LinkedInAccount`,
   `Proxy` secrets), the repository is also where a worker-only `findForWorker()` that
   opts back into the client `omit` lives — never select a sealed column from code a web
   request can reach.
3. **`service/`** — one exported function per use case, not one God object
   (`service/startRun.ts`, `service/pauseRun.ts`, each ≤100 lines per CLAUDE.md's size
   budget). Services return `Result<T, E>` (`server/result.ts`) for expected failures;
   they `throw` only for programmer errors or for the classified job-queue errors
   documented in the `add-job-type` skill.
4. **`actions.ts`** — one `"use server"` function per mutation, and it does exactly four
   things in order: authorize (`requireRole(...)`, independently of any layout guard —
   actions are directly addressable endpoints, CLAUDE.md invariant #5), zod-parse the
   input, call exactly one `service/` function, `revalidatePath`. If an action is pushing
   past ~30 lines, logic has leaked into it that belongs in `service/` — see AGENTS.md
   §4.1's size-budget split recipes.
5. **`ui/`** — components scoped to this slice. Shared, slice-agnostic primitives go in
   `src/ui/` instead.
6. **If the slice introduces new persisted state**, the schema change goes through the
   `schema-change` skill *before* `repository/` is written against it.
7. **Every user-visible mutation writes an `AuditEvent`** from inside the `service/`
   function that performs it (AGENTS.md §6) — not from the action, so it fires regardless
   of which action or future caller triggers the service.

## Checklist before calling it done

- [ ] `prisma` imported only in `repository/`
- [ ] Every `actions.ts` function re-authorizes independently
- [ ] Size budgets respected (action ≤100, service fn ≤100, repo ≤300)
- [ ] Sealed columns never selected outside a worker-only repository method
- [ ] `domain/` schema is what every layer above actually validates against — not a
      second, drifted copy
- [ ] Mutations write an `AuditEvent`
