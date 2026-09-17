import * as cheerio from "cheerio";
import { SELECTORS, SELECTORS_VERSION } from "./selectors";

export interface ProfileFields {
  fullName: string | null;
  headline: string | null;
  location: string | null;
  currentPosition: string | null;
  selectorsVersion: string;
}

function firstText($: cheerio.CheerioAPI, selectors: readonly string[]): string | null {
  for (const selector of selectors) {
    const text = $(selector).first().text().trim();
    if (text) return text;
  }
  return null;
}

/**
 * Pure function — no I/O, no Playwright `Page`. Re-runnable offline against a stored
 * capture (write-extractor skill), so a selector fix never requires re-scraping.
 */
export function extractProfileFields(html: string): ProfileFields {
  const $ = cheerio.load(html);
  return {
    fullName: firstText($, SELECTORS.profile.fullName),
    headline: firstText($, SELECTORS.profile.headline),
    location: firstText($, SELECTORS.profile.location),
    currentPosition: firstText($, SELECTORS.profile.currentPosition),
    selectorsVersion: SELECTORS_VERSION,
  };
}
