---
name: schema-change
description: The Prisma 7 workflow for this repo's split schema (prisma/schema/*.prisma) — validate, format, migrate, regenerate, and how to add SQL (CHECK constraints, NULLS NOT DISTINCT) that Prisma's schema language can't express. Use for any change to a model, enum, index, or relation under prisma/schema/.
metadata:
  project: linkedin-scrapper
---

# Change the Prisma schema

This project's schema is a **folder**, `prisma/schema/*.prisma`, split by domain (auth,
account, search, lead, jobs, audit — see ARCHITECTURE.md §4), not the single
`prisma/schema.prisma` file older Prisma versions use. `prisma.config.ts`'s `schema`
option points at the directory; Prisma loads every `*.prisma` file in it as one schema.

## The loop

1. **Edit the right domain file.** `schema/schema.prisma` is generator + datasource only —
   never add a model there. Everything else goes in the file matching its domain; if a
   new model doesn't fit an existing file, it's worth asking whether it's really a new
   domain or belongs in one of the six that exist.
2. **Validate before touching the database:** `pnpm exec prisma validate`. This is the
   cheapest possible check and it catches the most common mistake — a relation with no
   matching back-relation — before anything destructive is even considered.
3. **Format:** `pnpm exec prisma format`.
4. **Every `DateTime` is `@db.Timestamptz(3)`, no exceptions.** This project's Postgres
   server does not run UTC, and a naive `TIMESTAMP` column compares against `now()`
   through the session timezone — confirmed live to silently break queue visibility
   checks and active-hours windows (ARCHITECTURE.md §4). There is no case where the plain
   `DateTime` default is correct here.
5. **Migrate:** `pnpm db:migrate` (wraps `prisma migrate dev`) with a descriptive name. If
   the migration needs SQL Prisma's schema language cannot express — a `CHECK` constraint,
   `NULLS NOT DISTINCT` on a unique index — use `prisma migrate dev --create-only` instead,
   hand-edit the generated `migration.sql` to append it (with a comment explaining why it
   had to be hand-written), *then* run `prisma migrate dev` to apply it. This is not the
   same as hand-editing an already-applied migration, which stays forbidden (AGENTS.md §2)
   — the file has never been applied to any database at the point you edit it.
6. **Regenerate:** `pnpm db:generate`. Confirm new enums actually exported:
   `grep "^export" src/generated/prisma/enums.ts`.
7. **If the change touches a sealed secret column** (anything `*Sealed`, or
   `User.passwordHash`), add it to the client-level `omit` in `src/lib/prisma.ts` — a new
   secret column is not protected by default, only by that list.
8. **Update ARCHITECTURE.md §4's model-inventory table** if a model moved files or a new
   one was added — the table is the only place that tracks which domain file owns which
   model, and it drifts silently otherwise.

## A destructive operation needs the human, not just you

`prisma migrate reset` (or any other drop/recreate) trips Prisma's own agent-safety gate,
which refuses to run without the user's same-turn, explicit consent passed through
`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`. Don't try to route around it, pre-authorize
it from an earlier unrelated approval, or assume consent because the database "only has
test data" — ask, state exactly what will be destroyed and why it's believed safe, and
wait for a clear yes.

## Checklist before calling it done

- [ ] `prisma validate` and `prisma format` both clean
- [ ] Every new/changed `DateTime` column is `@db.Timestamptz(3)`
- [ ] Migration applied, client regenerated, new enums confirmed exported
- [ ] New sealed columns added to the `omit` in `src/lib/prisma.ts`
- [ ] ARCHITECTURE.md §4's model table still matches reality
- [ ] No destructive DB operation run without the human's explicit, same-turn consent
