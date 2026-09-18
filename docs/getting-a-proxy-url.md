# Getting a proxy URL

## The format this system expects

```
protocol://username:password@host:port
```

For example `http://user:pass@residential.example.com:8000`. Protocol is `http`, `https`,
or `socks5`, matching the option you pick when adding the proxy at `/config/proxies`.
Credentials are optional if the proxy doesn't require them.

## Free proxies: a warning, not a recommendation

Public/free proxy lists are a bad fit here, for reasons specific to what this system does
with a proxy connection, not proxies in general:

- **You'd be sending your LinkedIn credentials and an authenticated session cookie through
  a server you don't control and usually can't identify the operator of.** Many free
  proxies terminate TLS to inject ads or logging, which for an ordinary web page is
  merely bad; for a LinkedIn login it's handing your account to a stranger.
- **They're already-flagged, shared datacenter IPs.** Dozens of unrelated people cycle
  through the same free proxy; if any one of them has triggered LinkedIn's abuse
  detection on that IP, your traffic inherits the reputation. That is the opposite of what
  a proxy is for in this architecture (§9, layer 2: a stable, consistent identity).
- **They're unstable.** Free proxies drop, get abuse-reported, and change IP constantly —
  the "consistent location per account" property this system relies on doesn't hold.

If you're only experimenting with the dashboard itself (not actually scraping), leave
`useProxy` off entirely rather than reaching for a free proxy — that's a more honest
"no proxy" than a free one that fails the safety properties a proxy is supposed to provide.

## What to actually look for in a paid provider

Not vendor endorsements — pricing and reputation in this space move faster than a doc
file can track. Evaluate any provider against these properties instead:

- **Sticky sessions measured in tens of minutes to hours**, not per-request rotation. This
  system pins one proxy to one account precisely so the account's apparent location stays
  consistent; a provider that rotates your exit IP on every request defeats that.
- **Residential or mobile IP pools**, not datacenter ranges. Datacenter IPs are cheaper and
  faster but are exactly the kind of IP LinkedIn's abuse detection weighs most heavily —
  real residential/mobile traffic looks like a real person's home internet connection.
- **Per-country (ideally per-city) targeting**, so you can match a proxy's apparent
  location to where the account plausibly lives — an account that "lives" in Dhaka and
  suddenly proxies through Ohio is a textbook flag (ARCHITECTURE.md §9).
- **A real, diverse ASN mix** behind the pool, not a handful of easily-fingerprinted
  ranges — ask the provider directly if this isn't documented.
- **Authenticated access** (username/password or IP allowlist) rather than an open proxy —
  both for your own security and because open proxies get abused and blocklisted fast.

Search for "residential proxy" or "mobile proxy" providers with sticky-session support,
compare a few on the properties above, and test one account for a while before pointing
every account at the same provider.
