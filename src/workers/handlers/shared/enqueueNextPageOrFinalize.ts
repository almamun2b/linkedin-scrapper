import { enqueueJob } from "@/modules/jobs/service/queue.service";
import type { ScrapeRunModel } from "@/generated/prisma/models/ScrapeRun";

/** Shared by search.page.fetch: either queue the next page or hand off to run.finalize. */
export async function enqueueNextPageOrFinalize(params: {
  run: ScrapeRunModel;
  page: number;
  hasResults: boolean;
  accountId: string;
}): Promise<void> {
  const { run, page, hasResults, accountId } = params;
  if (hasResults && page < run.maxPages) {
    await enqueueJob({
      type: "search.page.fetch",
      payload: { scrapeRunId: run.id, page: page + 1 },
      runId: run.id,
      linkedInAccountId: accountId,
      idempotencyKey: `search.page:${run.id}:${page + 1}`,
    });
    return;
  }
  await enqueueJob({
    type: "run.finalize",
    payload: { scrapeRunId: run.id },
    runId: run.id,
    linkedInAccountId: accountId,
    idempotencyKey: `run.finalize:${run.id}`,
  });
}
