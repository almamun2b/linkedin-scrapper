---
name: write-extractor
description: Add or fix a LinkedIn HTML/DOM extractor in src/scraper/extract/ — selector conventions, the fallback-chain pattern, and how to check a parser change safely without a test suite or a live LinkedIn request. Use for profile/search-result/contact-info parsing, selector drift, or "LinkedIn changed their markup" fixes.
metadata:
  project: linkedin-scrapper
---

# Write or fix an extractor

Extractors are pure functions over HTML/serialized DOM, living in
`src/scraper/extract/`. They are the part of this system most exposed to LinkedIn's own
changes — markup drifts on LinkedIn's schedule, not ours — and this project has **no test
suite** to catch that drift automatically (a deliberate decision; see CLAUDE.md). This
skill is how to work on them safely anyway.

## The one rule that matters most

**Never point anything in this skill at live linkedin.com.** Not a debug script, not a
"let me just check the current markup" call, not a one-off `curl`. Extractors are
checked against **stored evidence** (`LeadSnapshot` rows, ARCHITECTURE.md §4), never
fresh requests — the LinkedIn account's daily quota is for the scraper, not for
development.

## Adding a new extractor

1. Selectors go in `src/scraper/extract/selectors.ts` — **one file, nowhere else**, so the
   whole selector surface is auditable in one place (it's exempt from the 300-line ceiling
   for exactly this reason). Every selector gets:
   - a `// verified YYYY-MM-DD` comment naming when it was last confirmed against real
     markup
   - a **fallback chain**, not a single string — prefer stable attributes and visible text
     anchors over generated/hashed class names, which LinkedIn rotates
2. Write the extractor itself as a pure function: `(html: string) => ParsedShape`, no I/O,
   no network, no Playwright `Page` object — it should be callable with nothing but a
   string. That purity is what makes step 4 below possible at all.
3. One extractor per entity (profile, search-result row, contact-info panel) — if it's
   growing past 300 lines, split field-level parsers into small pure functions beside it
   rather than one monolithic parser (AGENTS.md §4.1).
4. Wire it into the matching job handler (`profile.scrape`, `search.page.fetch`, …), which
   writes both the parsed fields onto `Lead` and the raw capture into `LeadSnapshot` —
   never one without the other (CLAUDE.md invariant #7). Store `selectorsVersion` on the
   snapshot so a later re-parse knows which selector set produced it.

## Fixing selector drift

1. Don't touch live LinkedIn to diagnose it. Pull a recent `LeadSnapshot.html` for a lead
   that's failing to parse and look at the captured markup directly.
2. Update the selector(s) in `selectors.ts`, bump the `// verified` date, keep or extend
   the fallback chain rather than replacing it outright (the old markup may still appear
   for some accounts/locales).
3. **Check the fix with `pnpm reparse`** (ARCHITECTURE.md §7, built per this project's
   no-test-suite design): it reloads stored `LeadSnapshot` rows, re-runs the current
   extractors over each `payload`, and diffs the result against the saved `Lead` fields.
   Run it against a reasonable sample of snapshots — including some captured *before* the
   drift, to confirm the fix didn't regress the previous markup shape.
4. This is the entire verification step. There is no fixture corpus and no CI run behind
   it — report plainly what `pnpm reparse` showed, including any leads whose fields
   changed as a result, rather than assuming the fix is complete.

## Checklist before calling it done

- [ ] No selector lives outside `selectors.ts`
- [ ] Every selector has a `// verified` date and a fallback chain
- [ ] The extractor function takes a string/DOM and nothing else — no I/O
- [ ] `selectorsVersion` is recorded on new `LeadSnapshot` rows
- [ ] Checked with `pnpm reparse` against real stored snapshots, and the output reported
- [ ] Nothing in this change makes a request to linkedin.com
