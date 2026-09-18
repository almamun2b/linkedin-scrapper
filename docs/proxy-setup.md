# Proxy setup

## Do you need one?

Not necessarily to start. A single LinkedIn account scraping slowly, with sane pacing and
active hours, can run for a while on your own IP. A proxy matters more once you're running
multiple accounts (each needs to look like it's coming from a consistent, distinct place)
or your own IP is a hosting/datacenter range LinkedIn already treats with suspicion.

If you do use one, treat it the way this system treats everything else here: as risk
*reduction*, never as a reason to raise concurrency or shorten pacing. A proxy does not
make automated collection "safe" or make LinkedIn's terms not apply.

## How it works in this system

Every LinkedIn account has an optional assigned `Proxy` (added at `/config/proxies`,
picked per account at `/config/accounts` → edit). There's also one global fallback proxy
URL on the scraping policy (`/config/policy`), used only for an account that has no
`Proxy` of its own assigned.

The toggle is `useProxy` on `/config/policy` — **one global switch**, not per-account:

- **Off:** the browser launches with no proxy configuration at all (not an empty one —
  literally the option is omitted), using your own network's IP.
- **On:** for each job, resolution happens in order:
  1. The account's own assigned `Proxy` row, if any.
  2. The fallback proxy URL on the scraping policy, if set.
  3. **The job fails.**

  There is deliberately no fourth option of "use the direct IP anyway." A silent fallback
  to your real IP is the worst possible failure mode here — it exposes the address you
  meant to hide at exactly the moment you believed it was hidden. If you turn proxying on,
  every account needs a working path to a proxy, full stop.

**Sticky, one proxy per account.** Assign a proxy to exactly one account and keep it that
way — an account whose apparent location keeps changing is itself a signal. The system
lets a proxy be shared by more than one account (the UI will warn you with a count), but
that's for migrating a proxy between accounts, not a way to save money by round-robining a
few accounts through one exit IP.

**Credentials are sealed.** Both the per-account `Proxy.passwordSealed` column and the
global fallback URL are AES-256-GCM encrypted at rest and only ever decrypted inside the
worker process — never in the web process, never logged.

## Adding a proxy

1. Go to `/config/proxies` → **Add proxy**.
2. Fill in protocol (HTTP/HTTPS/SOCKS5), host, port, and credentials if the proxy needs
   them. The password field is optional on edit — leave it blank to keep the current one.
3. Assign it to an account from that account's edit dialog on `/config/accounts`.
4. Turn `useProxy` on at `/config/policy` once every account you're running actually has a
   working proxy path (its own, or the fallback).

There is no automated proxy health check yet (`proxy.healthcheck` is a planned job type,
not implemented) — verify a new proxy works by running **Test connection** on an account
assigned to it and checking the result on `/jobs`.

See [getting-a-proxy-url.md](getting-a-proxy-url.md) for where to actually get one.
