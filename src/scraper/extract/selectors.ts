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

export const SELECTORS_VERSION = "2026-09-14-unverified";

export const SELECTORS = {
  login: {
    username: ["#username", "input[name='session_key']", "input[autocomplete='username']"],
    password: ["#password", "input[name='session_password']", "input[autocomplete='current-password']"],
    submit: ["button[type='submit']", "button[data-litms-control-urn='login-submit']"],
  },
  feed: {
    globalNav: ["#global-nav", "nav[aria-label='Primary Navigation']"],
    meNavLink: [
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
    resultName: [".entity-result__title-text span[aria-hidden='true']", "span.entity-result__title-text"],
    resultHeadline: [".entity-result__primary-subtitle", ".entity-result__summary"],
    resultLocation: [".entity-result__secondary-subtitle"],
  },
  contactInfo: {
    panel: ["div.pv-profile-section.pv-contact-info", "[data-view-name='profile-contact-info']"],
    email: ["a[href^='mailto:']", "section.ci-email a"],
    website: ["section.ci-websites a", "a[href^='http']:not([href*='linkedin.com'])"],
  },
} as const;
