import type { Locator, Page } from "playwright";
import { SELECTORS } from "../extract/selectors";
import { typingDelay, stepDelay, type DelayRange } from "../humanize/pacer";

async function firstVisible(page: Page, selectors: readonly string[]): Promise<Locator | null> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    const count = await locator.count().catch(() => 0);
    if (count > 0) {
      return locator;
    }
  }
  return null;
}

export interface LoginParams {
  email: string;
  password: string;
  stepDelayRange: DelayRange;
  signal: AbortSignal;
}

/** The one place a literal linkedin.com URL belongs — exempted by the safety-audit grep. */
export async function login(page: Page, params: LoginParams): Promise<void> {
  const { email, password, stepDelayRange, signal } = params;
  await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });

  const usernameField = await firstVisible(page, SELECTORS.login.username);
  if (!usernameField) {
    throw new Error("Login username field not found — selectors may be stale");
  }
  await usernameField.click();
  await usernameField.pressSequentially(email, { delay: typingDelay() });
  await stepDelay(stepDelayRange, signal);

  const passwordField = await firstVisible(page, SELECTORS.login.password);
  if (!passwordField) {
    throw new Error("Login password field not found — selectors may be stale");
  }
  await passwordField.click();
  await passwordField.pressSequentially(password, { delay: typingDelay() });
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
