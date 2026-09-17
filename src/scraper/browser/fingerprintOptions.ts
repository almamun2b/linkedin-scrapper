import type { BrowserContext } from "playwright";

/**
 * scraper/ never imports modules/ — this mirrors modules/linkedin-account/domain/fingerprint's
 * shape structurally rather than importing it, so this layer stays usable independent of the
 * application/domain layer.
 */
export interface ContextFingerprint {
  userAgent: string | null;
  viewport: { width: number; height: number };
  locale: string;
  timezoneId: string;
  deviceScaleFactor: number;
}

export function contextOptionsFromFingerprint(fingerprint: ContextFingerprint) {
  return {
    viewport: fingerprint.viewport,
    locale: fingerprint.locale,
    timezoneId: fingerprint.timezoneId,
    deviceScaleFactor: fingerprint.deviceScaleFactor,
    userAgent: fingerprint.userAgent ?? undefined,
  };
}

/**
 * Reads back the real UA the launched browser reports — never fabricates one (ARCHITECTURE
 * §9 layer 6: "clumsy spoofing is more detectable than plain automation"). Call once, right
 * after the first-ever launch for an account, while fingerprint.userAgent is still null.
 */
export async function captureRealUserAgent(context: BrowserContext): Promise<string> {
  const page = await context.newPage();
  try {
    return await page.evaluate(() => navigator.userAgent);
  } finally {
    await page.close();
  }
}
