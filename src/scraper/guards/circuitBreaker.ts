import type { Browser, BrowserContext } from "playwright";
import { logger } from "@/server/logger";
import { sealStorageState, type SealedState } from "../session/storageState";

const log = logger.child({ module: "circuitBreaker" });

/**
 * On any risk signal: save storageState, close the browser. Returns the sealed bytes for
 * the *handler* to persist and act on (mark CHALLENGED, cancel queued jobs, audit) — this
 * module does only the Playwright-side mechanism, never touches modules/ or the database
 * directly (scraper/ must never import modules/). Never auto-retries (CLAUDE.md invariant #3).
 */
export async function containBreach(params: {
  browser: Browser;
  context: BrowserContext;
}): Promise<SealedState | null> {
  const { browser, context } = params;
  let sealed: SealedState | null = null;
  try {
    sealed = await sealStorageState(context);
  } catch (error) {
    log.error({ err: error }, "failed to seal storageState during breach containment");
  }
  await browser.close().catch((error: unknown) => {
    log.error({ err: error }, "failed to close browser during breach containment");
  });
  return sealed;
}
