import { chromium, type Browser, type BrowserContext } from "playwright";
import { contextOptionsFromFingerprint, type ContextFingerprint } from "./fingerprintOptions";
import type { ScraperProxy } from "./proxy";

type StorageState = Awaited<ReturnType<BrowserContext["storageState"]>>;

export interface LaunchedSession {
  browser: Browser;
  context: BrowserContext;
}

export interface LaunchParams {
  headless: boolean;
  fingerprint: ContextFingerprint;
  storageState?: StorageState;
  proxy: ScraperProxy | null;
}

const BLOCKED_RESOURCE_TYPES = new Set(["image", "media", "font"]);

/**
 * Non-persistent context (not `launchPersistentContext`) so the session is portable across
 * worker restarts via sealed storageState, matching ARCHITECTURE.md §7's "loads sealed
 * storageState, opens context... re-seals cookies" description of session.ensure.
 */
export async function launchContextForAccount(params: LaunchParams): Promise<LaunchedSession> {
  const { headless, fingerprint, storageState, proxy } = params;

  // proxy omitted entirely when null — never `{}` — CLAUDE.md invariant #9.
  const browser = await chromium.launch({
    headless,
    ...(proxy ? { proxy } : {}),
  });

  const context = await browser.newContext({
    storageState,
    ...contextOptionsFromFingerprint(fingerprint),
  });

  // Bandwidth only — never block script/xhr/fetch, and never patch `navigator` properties
  // (ARCHITECTURE.md §9 layer 6: clumsy spoofing is more detectable than plain automation).
  await context.route("**/*", (route) => {
    const resourceType = route.request().resourceType();
    if (BLOCKED_RESOURCE_TYPES.has(resourceType)) {
      return route.abort();
    }
    return route.continue();
  });

  return { browser, context };
}
