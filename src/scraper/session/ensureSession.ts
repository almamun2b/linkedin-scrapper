import type { BrowserContext, Page } from "playwright";
import { classifyResponse, type RiskSignal } from "./detect";
import { login } from "../pages/login.page";
import { isLoggedIn, discoverOwnProfileUrl } from "../pages/feed.page";
import type { DelayRange } from "../humanize/pacer";

export interface EnsureSessionParams {
  context: BrowserContext;
  email: string;
  password: string;
  stepDelayRange: DelayRange;
  signal: AbortSignal;
}

export type EnsureSessionResult =
  | { loggedIn: true; profileUrl: string | null }
  | { loggedIn: false; risk: RiskSignal; page: Page };

const FEED_URL = "https://www.linkedin.com/feed/";

/**
 * Session reuse first: only calls `login()` — the riskiest single action, per ARCHITECTURE
 * §9 layer 1 — if the existing (unsealed) storageState didn't already produce a logged-in
 * feed. Plain inputs/outputs only; scraper/ never imports modules/.
 *
 * The pre-login check ignores a bare `login_redirect`: landing on `/uas/login` before any
 * credentials were sent just means there's no (or an expired) session — expected for a
 * fresh account, not a risk signal (ARCHITECTURE.md §7: "if logged out, performs credential
 * login"). `checkpoint`/`authwall`/`captcha` there are still genuine risks, since those mean
 * LinkedIn is already blocking access before login was even attempted. Once `login()` has
 * actually run, any risk signal — `login_redirect` included — means the submitted
 * credentials didn't stick, which is a real problem and must trip the breaker.
 *
 * The failure branch deliberately does *not* close `page` — it hands it back so the caller
 * can capture a screenshot/HTML before the breaker closes the whole browser
 * (`handleRiskSignal`). The success branch closes it itself since nothing after this needs
 * it.
 */
export async function ensureSession(params: EnsureSessionParams): Promise<EnsureSessionResult> {
  const { context, email, password, stepDelayRange, signal } = params;
  const page = await context.newPage();

  await page.goto(FEED_URL, { waitUntil: "domcontentloaded" });
  let risk = await classifyResponse(page);
  if (risk && risk.kind !== "login_redirect") return { loggedIn: false, risk, page };

  if (!(await isLoggedIn(page))) {
    await login(page, { email, password, stepDelayRange, signal });

    // Check the page login() actually left us on before navigating away from it — a blind
    // re-goto to FEED_URL below would discard whatever LinkedIn showed right after the real
    // submit (a checkpoint, a 2FA prompt, an inline "wrong password" message), replacing it
    // with a fresh, generic /uas/login redirect that carries none of that diagnostic value.
    risk = await classifyResponse(page);
    if (risk) return { loggedIn: false, risk, page };
    if (!(await isLoggedIn(page))) {
      await page.goto(FEED_URL, { waitUntil: "domcontentloaded" });
      risk = await classifyResponse(page);
      if (risk) return { loggedIn: false, risk, page };
      if (!(await isLoggedIn(page))) {
        return { loggedIn: false, risk: { kind: "login_redirect", details: page.url() }, page };
      }
    }
  }

  const profileUrl = await discoverOwnProfileUrl(page);
  await page.close();
  return { loggedIn: true, profileUrl };
}
