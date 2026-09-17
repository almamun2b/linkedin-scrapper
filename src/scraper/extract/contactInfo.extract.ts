import * as cheerio from "cheerio";
import { SELECTORS } from "./selectors";

export interface ContactInfoFields {
  email: string | null;
  websiteUrl: string | null;
}

/** Pure — no I/O, no Playwright Page. Parses the contact-info panel's captured HTML. */
export function extractContactInfo(html: string): ContactInfoFields {
  const $ = cheerio.load(html);

  let email: string | null = null;
  for (const selector of SELECTORS.contactInfo.email) {
    const href = $(selector).first().attr("href");
    if (href?.startsWith("mailto:")) {
      email = href.slice("mailto:".length).trim();
      break;
    }
  }

  let websiteUrl: string | null = null;
  for (const selector of SELECTORS.contactInfo.website) {
    const href = $(selector).first().attr("href");
    if (href) {
      websiteUrl = href.trim();
      break;
    }
  }

  return { email, websiteUrl };
}
