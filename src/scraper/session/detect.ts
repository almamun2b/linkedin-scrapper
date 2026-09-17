import type { Page } from "playwright";

export type RiskSignalKind = "checkpoint" | "authwall" | "login_redirect" | "http_999" | "captcha";

export interface RiskSignal {
  kind: RiskSignalKind;
  details: string;
}

// UNVERIFIED — see scraper/extract/selectors.ts for why these can't be confirmed live.
const CAPTCHA_SELECTORS = [
  "iframe[src*='captcha']",
  "[data-test-id='challenge']",
  "#captcha-internal-challenge",
];

/**
 * Call after a navigation where the caller expects to already be authenticated (e.g. after
 * `/feed/`). Never call this on the login page itself mid-flow — being on `/login` there is
 * expected, not a risk signal.
 */
export async function classifyResponse(page: Page): Promise<RiskSignal | null> {
  const url = page.url();
  if (url.includes("/checkpoint/")) {
    return { kind: "checkpoint", details: url };
  }
  if (url.includes("/authwall")) {
    return { kind: "authwall", details: url };
  }
  if (url.includes("/uas/login")) {
    return { kind: "login_redirect", details: url };
  }
  for (const selector of CAPTCHA_SELECTORS) {
    const count = await page
      .locator(selector)
      .count()
      .catch(() => 0);
    if (count > 0) {
      return { kind: "captcha", details: selector };
    }
  }
  return null;
}

export function classifyHttpStatus(status: number | null): RiskSignal | null {
  if (status === 999) {
    return { kind: "http_999", details: "HTTP 999" };
  }
  return null;
}
