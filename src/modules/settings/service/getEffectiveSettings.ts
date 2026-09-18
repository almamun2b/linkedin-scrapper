import * as settingsRepo from "../repository/settings.repository";

const CACHE_TTL_MS = 30_000;

/**
 * The worker's poll loop reads these on every tick — a query per tick would be wasteful, so
 * this caches both singletons for a short TTL and every write path (`updateScrapingPolicy`,
 * `updateSystemSetting`) calls `invalidateSettingsCache()` explicitly rather than waiting out
 * the window, so a config change from `/config` still applies promptly.
 */
let scrapingPolicyCache: { value: Awaited<ReturnType<typeof settingsRepo.getScrapingPolicy>>; at: number } | null =
  null;
let systemSettingCache: { value: Awaited<ReturnType<typeof settingsRepo.getSystemSetting>>; at: number } | null =
  null;

export async function getScrapingPolicy() {
  if (scrapingPolicyCache && Date.now() - scrapingPolicyCache.at < CACHE_TTL_MS) {
    return scrapingPolicyCache.value;
  }
  const value = await settingsRepo.getScrapingPolicy();
  scrapingPolicyCache = { value, at: Date.now() };
  return value;
}

export async function getSystemSetting() {
  if (systemSettingCache && Date.now() - systemSettingCache.at < CACHE_TTL_MS) {
    return systemSettingCache.value;
  }
  const value = await settingsRepo.getSystemSetting();
  systemSettingCache = { value, at: Date.now() };
  return value;
}

export function invalidateSettingsCache(): void {
  scrapingPolicyCache = null;
  systemSettingCache = null;
}
