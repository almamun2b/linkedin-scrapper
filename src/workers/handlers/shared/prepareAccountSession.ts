import { env } from "@/server/config/env";
import { unsealSecret } from "@/server/crypto/secretBox";
import { ok, err, type Result } from "@/server/result";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import * as policyRepo from "@/modules/linkedin-account/repository/scrapingPolicy.repository";
import * as proxyRepo from "@/modules/proxy/repository/proxy.repository";
import { fingerprintSchema, type AccountFingerprint } from "@/modules/linkedin-account/domain/fingerprint";
import { isWithinActiveHours, nextWindowStart } from "@/scraper/guards/activeHours";
import { resolveProxy, type ScraperProxy, type ProxyCandidate } from "@/scraper/browser/proxy";

type Account = NonNullable<Awaited<ReturnType<typeof accountRepo.findForWorker>>>;
type Policy = NonNullable<Awaited<ReturnType<typeof policyRepo.findByAccountId>>>;

export interface PreparedSession {
  account: Account;
  policy: Policy;
  fingerprint: AccountFingerprint;
  proxy: ScraperProxy | null;
}

export type PrepareError =
  | { kind: "not_found" }
  | { kind: "outside_active_hours"; nextRunAt: Date }
  | { kind: "proxy_unresolvable" };

/**
 * Shared bootstrap for both browser-bound job handlers: load account+policy, gate on active
 * hours, resolve the proxy per USE_PROXY semantics (CLAUDE.md invariant #9). Lives in
 * workers/ (not scraper/) because it needs modules/ — scraper/ must never import modules/.
 */
export async function prepareAccountSession(
  accountId: string,
  now: Date,
): Promise<Result<PreparedSession, PrepareError>> {
  const account = await accountRepo.findForWorker(accountId);
  if (!account) return err({ kind: "not_found" });
  const policy = await policyRepo.findByAccountId(accountId);
  if (!policy) return err({ kind: "not_found" });

  const activeHoursPolicy = {
    activeHoursStart: policy.activeHoursStart,
    activeHoursEnd: policy.activeHoursEnd,
    activeOnWeekends: policy.activeOnWeekends,
  };
  if (!isWithinActiveHours(now, activeHoursPolicy, account.timezone)) {
    return err({
      kind: "outside_active_hours",
      nextRunAt: nextWindowStart(now, activeHoursPolicy, account.timezone),
    });
  }

  const fingerprint = fingerprintSchema.parse(account.fingerprint);

  let accountProxy: ProxyCandidate | null = null;
  if (policy.useProxy && account.proxyId) {
    const proxyRow = await proxyRepo.findForWorker(account.proxyId);
    if (proxyRow) {
      accountProxy = {
        protocol: proxyRow.protocol,
        host: proxyRow.host,
        port: proxyRow.port,
        username: proxyRow.username,
        password: proxyRow.passwordSealed
          ? unsealSecret(proxyRow.passwordSealed, proxyRow.passwordKeyVer ?? 1)
          : null,
      };
    }
  }
  const proxyResult = resolveProxy({
    useProxy: policy.useProxy,
    accountProxy,
    proxyUrl: env.PROXY_URL || null,
  });
  if (!proxyResult.ok) {
    return err({ kind: "proxy_unresolvable" });
  }

  return ok({ account, policy, fingerprint, proxy: proxyResult.value });
}
