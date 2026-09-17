import * as cheerio from "cheerio";
import { SELECTORS } from "./selectors";

export interface SearchResultRow {
  profileUrl: string;
  fullName: string | null;
  headline: string | null;
  location: string | null;
  rowHtml: string;
}

type CheerioAPI = cheerio.CheerioAPI;

function firstText(row: ReturnType<CheerioAPI>, selectors: readonly string[]): string | null {
  for (const selector of selectors) {
    const text = row.find(selector).first().text().trim();
    if (text) return text;
  }
  return null;
}

function firstHref(row: ReturnType<CheerioAPI>, selectors: readonly string[]): string | null {
  for (const selector of selectors) {
    const href = row.find(selector).first().attr("href");
    if (href) return href;
  }
  return null;
}

/** Pure — no I/O, no Playwright Page. One row per matched result, replayable via `pnpm reparse`. */
export function extractSearchResults(html: string): SearchResultRow[] {
  const $ = cheerio.load(html);
  const rows: SearchResultRow[] = [];

  for (const rowSelector of SELECTORS.search.resultRow) {
    const matches = $(rowSelector);
    if (matches.length === 0) continue;

    matches.each((_, el) => {
      const row = $(el);
      const href = firstHref(row, SELECTORS.search.resultProfileLink);
      if (!href) return;
      rows.push({
        profileUrl: href.split("?")[0] ?? href,
        fullName: firstText(row, SELECTORS.search.resultName),
        headline: firstText(row, SELECTORS.search.resultHeadline),
        location: firstText(row, SELECTORS.search.resultLocation),
        rowHtml: $.html(el),
      });
    });
    break; // first matching row-selector chain wins — don't double-count via a fallback pass
  }

  return rows;
}
