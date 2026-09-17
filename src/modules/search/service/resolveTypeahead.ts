import { logger } from "@/server/logger";
import type { FilterRefKind } from "@/generated/prisma/enums";
import { enqueueJob } from "@/modules/jobs/service/queue.service";

const log = logger.child({ module: "search.resolveTypeahead" });

/**
 * UI-facing half of typeahead resolution. Resolving a label -> URN requires a real LinkedIn
 * request, which invariant #1 forbids from a Server Action — so this only enqueues a job for
 * the worker (search.typeahead.resolve) rather than calling out itself. The UI's own picker
 * queries FilterRef.searchCached() instantly; this is the explicit "go fetch a new one"
 * escape hatch, and is asynchronous by design (see that handler for the unresolved endpoint).
 */
export async function requestTypeaheadResolution(params: {
  linkedInAccountId: string;
  kind: FilterRefKind;
  query: string;
}): Promise<{ queued: boolean }> {
  const normalized = params.query.trim().toLowerCase();
  const job = await enqueueJob({
    type: "search.typeahead.resolve",
    payload: {
      linkedInAccountId: params.linkedInAccountId,
      kind: params.kind,
      query: params.query,
    },
    linkedInAccountId: params.linkedInAccountId,
    idempotencyKey: `typeahead:${params.kind}:${normalized}`,
  });
  log.info(
    { kind: params.kind, query: params.query, queued: Boolean(job) },
    "typeahead resolution requested",
  );
  return { queued: Boolean(job) };
}
