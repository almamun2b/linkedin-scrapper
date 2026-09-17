import type { Browser, BrowserContext } from "playwright";
import { logger } from "@/server/logger";
import { RiskSignalError } from "@/modules/jobs/domain/errors";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import * as auditRepo from "@/modules/audit/repository/auditEvent.repository";
import { markChallenged } from "@/modules/linkedin-account/service/statusTransitions";
import { containBreach } from "@/scraper/guards/circuitBreaker";
import type { RiskSignal } from "@/scraper/session/detect";

const log = logger.child({ module: "handleRiskSignal" });

/**
 * The four-step "trip the breaker" sequence every browser-bound handler repeats on a risk
 * signal (save storageState, mark CHALLENGED, audit, throw) — factored once here so each
 * handler stays within the job-handler size budget instead of inlining this every time.
 * Never returns — always throws RiskSignalError (CLAUDE.md invariant #3: never retry through
 * a challenge).
 */
export async function handleRiskSignal(params: {
  accountId: string;
  browser: Browser;
  context: BrowserContext;
  risk: RiskSignal;
  handlerName: string;
}): Promise<never> {
  const { accountId, browser, context, risk, handlerName } = params;
  const sealed = await containBreach({ browser, context });
  if (sealed) await accountRepo.updateStorageState(accountId, sealed.sealed, sealed.keyVer);
  await markChallenged(accountId, `${handlerName} risk: ${risk.kind} (${risk.details})`);
  await auditRepo.record({
    action: "linkedin_account.challenged",
    entity: "LinkedInAccount",
    entityId: accountId,
    data: risk,
  });
  log.warn({ accountId, handlerName, risk }, "risk signal — breaker tripped");
  throw new RiskSignalError(`Risk signal during ${handlerName}: ${risk.kind}`);
}
