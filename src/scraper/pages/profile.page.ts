import type { Page } from "playwright";
import { SELECTORS } from "../extract/selectors";

/** Navigates to the given profile URL and returns the rendered HTML for offline extraction.
 * Generic — used for both the account's own profile and any other profile it visits. */
export async function openProfile(page: Page, url: string): Promise<string> {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  for (const selector of SELECTORS.profile.topCard) {
    const visible = await page
      .locator(selector)
      .first()
      .isVisible()
      .catch(() => false);
    if (visible) break;
  }
  return page.content();
}
