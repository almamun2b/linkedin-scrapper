/**
 * Every selector the scraper uses lives here, one auditable place (AGENTS.md §3) — exempt
 * from the 300-line ceiling for exactly that reason. Each entry is a fallback chain, not a
 * single string: prefer stable attributes and visible-text anchors over generated/hashed
 * classes LinkedIn rotates.
 *
 * UNVERIFIED — no agent may load real linkedin.com markup to confirm these (CLAUDE.md
 * invariant #10; the write-extractor skill). They are informed by LinkedIn's standard
 * desktop login form ids and typical DOM landmarks, not verified against a live capture.
 * Fix drift from a real stored capture (see the profile.self.scrape job's JobLog row) —
 * never from a fresh linkedin.com request — and bump SELECTORS_VERSION when you do.
 */

export const SELECTORS_VERSION = "2026-09-18-feed-nav-verified";

export const SELECTORS = {
  login: {
    username: ["#username", "input[name='session_key']", "input[autocomplete='username']"],
    password: [
      "#password",
      "input[name='session_password']",
      "input[autocomplete='current-password']",
    ],
    // verified 2026-09-18 (user-supplied DOM capture): current button is `type="button"`
    // with only hashed classes and a per-render `componentkey` — none stable. Kept as
    // trailing fallbacks in case an older/other-locale form still renders them; the
    // text-anchor entry is what actually matches today's markup.
    //
    // Two pitfalls confirmed against a reproduction of the real markup:
    // 1. `:text-is()` only matches an element's *direct* text node, not aggregated
    //    descendant text — LinkedIn wraps "Sign in" in two nested `<span>`s, so
    //    `button:text-is('Sign in')` never matches the button itself.
    // 2. This page variant also renders "Sign in with Apple"/"Sign in with Google" SSO
    //    buttons above the real one — a loose `:has-text('Sign in')` substring-matches
    //    those instead, which is worse than not matching at all.
    // `:has-text()` aggregates descendant text (fixing #1) combined with a `:not()`
    // exclusion on the SSO buttons' distinguishing " with " suffix (fixing #2).
    submit: [
      "button[type='submit']",
      "button[data-litms-control-urn='login-submit']",
      "button:has-text('Sign in'):not(:has-text('Sign in with'))",
    ],
  },
  // verified 2026-09-18 (replayed offline against a real successful login's captured
  // evidence — never a fresh linkedin.com request): the old `#global-nav` id no longer
  // exists at all — LinkedIn now marks the same top bar with `data-testid="primary-nav"`
  // instead. This was a real false positive: `isLoggedIn` couldn't find `#global-nav` on a
  // page that WAS the authenticated feed, so session.ensure synthesized a bogus
  // `login_redirect` risk and tripped the breaker on a working login.
  feed: {
    globalNav: [
      "[data-testid='primary-nav']",
      "#global-nav",
      "nav[aria-label='Primary Navigation']",
    ],
    // Still best-effort, NOT verified: the top nav's "Me" icon is only a dropdown trigger
    // (`href="#"`) in the static DOM — the real profile link isn't there until it's clicked
    // open. The link does exist elsewhere (sidebar card), but every occurrence found in a
    // real capture had only hashed classes or the account's own slug (not something
    // selectors.ts can hardcode generically). Kept as a best-effort chain; a null result
    // here is handled gracefully by `discoverOwnProfileUrl`'s caller, not fatal.
    meNavLink: [
      "[data-testid='primary-nav'] a[href*='/in/']",
      "a[href*='/in/'][data-control-name='identity_welcome_message']",
      "#global-nav a[href*='/in/']",
    ],
  },
  profile: {
    topCard: [
      ".pv-text-details__left-panel",
      "[data-view-name='profile-card']",
      "main section:first-of-type",
    ],
    fullName: ["h1.text-heading-xlarge", "main h1"],
    headline: [".text-body-medium.break-words", "[data-generated-suggestion-target]"],
    location: [".text-body-small.inline.t-black--light.break-words"],
    currentPosition: [
      "[data-field='experience_company_logo'] + div span[aria-hidden='true']",
      ".pv-text-details__right-panel li",
    ],
    contactInfoLink: ["a#top-card-text-details-contact-info", "a[href*='contact-info']"],
  },
  search: {
    resultRow: ["li.reusable-search__result-container", "[data-view-name='search-entity-result']"],
    resultProfileLink: ["a.app-aware-link[href*='/in/']", "a[href*='/in/']"],
    resultName: [
      ".entity-result__title-text span[aria-hidden='true']",
      "span.entity-result__title-text",
    ],
    resultHeadline: [".entity-result__primary-subtitle", ".entity-result__summary"],
    resultLocation: [".entity-result__secondary-subtitle"],
  },
  contactInfo: {
    panel: ["div.pv-profile-section.pv-contact-info", "[data-view-name='profile-contact-info']"],
    email: ["a[href^='mailto:']", "section.ci-email a"],
    website: ["section.ci-websites a", "a[href^='http']:not([href*='linkedin.com'])"],
  },
} as const;
