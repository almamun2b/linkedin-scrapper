import type { ElementHandle, Page } from "playwright";
import { SELECTORS } from "../extract/selectors";
import { typingDelay, stepDelay, type DelayRange } from "../humanize/pacer";

const FIRST_VISIBLE_TIMEOUT_MS = 8000;
const FIRST_VISIBLE_POLL_MS = 200;

/**
 * Checks each candidate match's actual visibility, not just DOM presence — LinkedIn's login
 * form ships a visually-hidden duplicate input alongside the real one (a common anti-bot
 * decoy), so `.first()` on a bare selector can silently resolve to the hidden copy and hang
 * waiting for it to become clickable.
 *
 * Polls for up to `FIRST_VISIBLE_TIMEOUT_MS`: the login page is client-rendered, so the form
 * fields don't necessarily exist yet the instant `domcontentloaded` fires — a one-shot
 * `count()` right after navigation can race the page's own hydration and report "not found"
 * on a field that appears a few hundred ms later. `count()`/`isVisible()` don't auto-wait the
 * way `click()` does, so this loop provides that waiting explicitly.
 *
 * Returns an `ElementHandle`, not a `Locator`, deliberately: this page also renders
 * third-party SSO buttons (Google/Apple) whose iframes/content load asynchronously and can
 * shift how many elements match a given selector after the fact. A `Locator` re-resolves its
 * selector+index on every action, so if the match set changes between finding the field and
 * typing into it, `nth(i)` can silently retarget a different (possibly hidden) node and hang
 * waiting for it to become actionable. An `ElementHandle` pins to the exact DOM node found
 * here — later actions target that node specifically, or fail fast if it's gone, instead of
 * quietly re-querying into the wrong one.
 */
async function firstVisible(
  page: Page,
  selectors: readonly string[],
): Promise<ElementHandle<HTMLElement | SVGElement> | null> {
  const deadline = Date.now() + FIRST_VISIBLE_TIMEOUT_MS;
  for (;;) {
    for (const selector of selectors) {
      const matches = page.locator(selector);
      const count = await matches.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const candidate = matches.nth(i);
        if (await candidate.isVisible().catch(() => false)) {
          const handle = await candidate.elementHandle().catch(() => null);
          if (handle) return handle;
        }
      }
    }
    if (Date.now() >= deadline) return null;
    await page.waitForTimeout(FIRST_VISIBLE_POLL_MS);
  }
}

export interface LoginParams {
  email: string;
  password: string;
  stepDelayRange: DelayRange;
  signal: AbortSignal;
}

/**
 * Carries the live `page` out of a failed login attempt so the caller (session.ensure,
 * which has the `jobId` and DB access `scraper/` must never import) can capture a
 * screenshot/HTML before the browser closes — the same "replay offline instead of guessing
 * blind" evidence this project already captures for a confirmed risk signal, extended to a
 * plain selector/UI failure that isn't necessarily a risk.
 */
export class LoginInteractionError extends Error {
  constructor(
    message: string,
    readonly page: Page,
  ) {
    super(message);
    this.name = "LoginInteractionError";
  }
}

/** The one place a literal linkedin.com URL belongs — exempted by the safety-audit grep. */
export async function login(page: Page, params: LoginParams): Promise<void> {
  try {
    await runLogin(page, params);
  } catch (error) {
    throw new LoginInteractionError(error instanceof Error ? error.message : String(error), page);
  }
}

async function runLogin(page: Page, params: LoginParams): Promise<void> {
  const { email, password, stepDelayRange, signal } = params;
  await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });

  const usernameField = await firstVisible(page, SELECTORS.login.username);
  if (!usernameField) {
    throw new Error("Login username field not found — selectors may be stale");
  }
  await usernameField.click();
  // `ElementHandle.type` is deprecated in favor of `Locator.pressSequentially`, but we need
  // the pinned-node guarantee an ElementHandle gives (see `firstVisible`) — the per-character
  // delay behavior this humanized typing relies on is otherwise identical.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  await usernameField.type(email, { delay: typingDelay() });
  await stepDelay(stepDelayRange, signal);

  const passwordField = await firstVisible(page, SELECTORS.login.password);
  if (!passwordField) {
    throw new Error("Login password field not found — selectors may be stale");
  }
  await passwordField.click();
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  await passwordField.type(password, { delay: typingDelay() });
  await stepDelay(stepDelayRange, signal);

  const submitButton = await firstVisible(page, SELECTORS.login.submit);
  if (!submitButton) {
    throw new Error("Login submit button not found — selectors may be stale");
  }
  await Promise.all([
    // `waitForNavigation` is deprecated in favor of `waitForURL`, but the post-submit
    // destination is intentionally unknown here (feed, a checkpoint/authwall, or an error
    // state the circuit breaker must see) — there is no URL pattern to wait for instead.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => undefined),
    submitButton.click(),
  ]);
}
