import type { Browser, BrowserContext, Page } from "playwright";
import { logger } from "@/server/logger";
import { RiskSignalError } from "@/modules/jobs/domain/errors";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import * as auditRepo from "@/modules/audit/repository/auditEvent.repository";
import * as jobsRepo from "@/modules/jobs/repository/jobs.repository";
import { markChallenged } from "@/modules/linkedin-account/service/statusTransitions";
import { containBreach } from "@/scraper/guards/circuitBreaker";
import { SELECTORS_VERSION } from "@/scraper/extract/selectors";
import type { RiskSignal } from "@/scraper/session/detect";

const log = logger.child({ module: "handleRiskSignal" });

/**
 * Best-effort evidence capture — a screenshot and the page's HTML, so a human (or a later
 * fix) can tell a real LinkedIn challenge apart from a stale selector without spending
 * another login attempt to find out (invariant #7's "replay offline" philosophy, applied to
 * the session path). Never throws: a capture failure must not stop the caller's own error
 * handling. `label` isn't restricted to `RiskSignal` — session.ensure also calls this for a
 * plain `login()` failure (selector drift, a UI timeout) that isn't a confirmed risk signal.
 */
export async function captureEvidence(
  jobId: string,
  page: Page,
  label: { kind: string; details: string },
): Promise<void> {
  try {
    const [screenshot, html, title] = await Promise.all([
      page.screenshot({ type: "png" }).catch(() => null),
      page.content().catch(() => null),
      page.title().catch(() => ""),
    ]);
    if (screenshot) {
      await jobsRepo.createArtifact({
        jobId,
        kind: "SCREENSHOT",
        contentType: "image/png",
        bytes: screenshot,
      });
    }
    if (html) {
      await jobsRepo.createArtifact({
        jobId,
        kind: "HTML",
        contentType: "text/html",
        bytes: Buffer.from(html, "utf8"),
      });
    }
    await jobsRepo.writeLog({
      jobId,
      level: "WARN",
      message: `${label.kind}: ${label.details}`,
      data: { url: page.url(), title, selectorsVersion: SELECTORS_VERSION, label },
    });
  } catch (error) {
    log.error({ err: error, jobId }, "failed to capture evidence");
  }
}

/**
 * The four-step "trip the breaker" sequence every browser-bound handler repeats on a risk
 * signal (capture evidence, save storageState, mark CHALLENGED, audit, throw) — factored
 * once here so each handler stays within the job-handler size budget instead of inlining
 * this every time. `page`/`jobId` are optional because not every caller has both readily at
 * hand yet — when both are given, evidence is captured before the browser closes. Never
 * returns — always throws RiskSignalError (CLAUDE.md invariant #3: never retry through a
 * challenge).
 */
export async function handleRiskSignal(params: {
  accountId: string;
  browser: Browser;
  context: BrowserContext;
  risk: RiskSignal;
  handlerName: string;
  page?: Page;
  jobId?: string;
}): Promise<never> {
  const { accountId, browser, context, risk, handlerName, page, jobId } = params;
  if (page && jobId) {
    await captureEvidence(jobId, page, risk);
  }
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
  throw new RiskSignalError(`Risk signal during ${handlerName}: ${risk.kind} (${risk.details})`);
}
