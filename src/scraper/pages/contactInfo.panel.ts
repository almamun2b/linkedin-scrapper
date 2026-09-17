import type { Page } from "playwright";
import { SELECTORS } from "../extract/selectors";

/**
 * Own file per the size-budget split recipe for panels/overlays (AGENTS.md §4.1: "never
 * methods on the profile page"). Returns null if the contact-info link isn't present at all
 * (not every profile exposes one) rather than throwing — the caller treats that as "no
 * contact info available," not a failure.
 */
export async function openContactInfoPanel(page: Page): Promise<string | null> {
  let link = null;
  for (const selector of SELECTORS.profile.contactInfoLink) {
    const locator = page.locator(selector).first();
    if (await locator.count().catch(() => 0)) {
      link = locator;
      break;
    }
  }
  if (!link) return null;

  await link.click();
  for (const selector of SELECTORS.contactInfo.panel) {
    const visible = await page
      .locator(selector)
      .first()
      .isVisible()
      .catch(() => false);
    if (visible) break;
  }
  const html = await page.content();
  await page.keyboard.press("Escape").catch(() => undefined);
  return html;
}
