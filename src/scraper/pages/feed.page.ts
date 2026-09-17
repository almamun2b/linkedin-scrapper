import type { Page } from "playwright";
import { SELECTORS } from "../extract/selectors";

export async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  if (url.includes("/login") || url.includes("/authwall") || url.includes("/checkpoint/")) {
    return false;
  }
  for (const selector of SELECTORS.feed.globalNav) {
    const count = await page
      .locator(selector)
      .count()
      .catch(() => 0);
    if (count > 0) return true;
  }
  return false;
}

/** Reads the nav bar's own-profile link rather than guessing a URL shape. */
export async function discoverOwnProfileUrl(page: Page): Promise<string | null> {
  for (const selector of SELECTORS.feed.meNavLink) {
    const href = await page
      .locator(selector)
      .first()
      .getAttribute("href")
      .catch(() => null);
    if (href) {
      return new URL(href, page.url()).toString();
    }
  }
  return null;
}
