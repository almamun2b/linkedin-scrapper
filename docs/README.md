# Docs

User- and operator-facing documentation for running this system — not developer process
docs (those are [AGENTS.md](../AGENTS.md), [CLAUDE.md](../CLAUDE.md), and
[ARCHITECTURE.md](../ARCHITECTURE.md) at the repo root).

Read in this order if you're new here:

1. **[how-scraping-works.md](how-scraping-works.md)** — what happens between clicking
   "Run" on a search and leads showing up, the safety mechanisms in the way, what each
   error means, and a troubleshooting section for the common "nothing is happening" and
   "Test connection failed" cases.
2. **[configuration.md](configuration.md)** — every setting on `/config/policy` and
   `/config/system`: what it does, its default, and why it exists. The same text the
   hover-help (ⓘ) icons on those pages show.
3. **[proxy-setup.md](proxy-setup.md)** — how proxying works in this system, when you need
   one, and how to add it.
4. **[getting-a-proxy-url.md](getting-a-proxy-url.md)** — where to actually get a proxy URL,
   free vs. paid, and what to look for.

**Before any of this:** automated collection of LinkedIn data breaks LinkedIn's User
Agreement. Every mechanism described in these docs — pacing, quotas, active hours, the
circuit breaker — *reduces and contains* the risk of the account being restricted. None of
it makes this "safe" or "against the rules but fine." Use an account you can afford to
lose, never a primary one.
