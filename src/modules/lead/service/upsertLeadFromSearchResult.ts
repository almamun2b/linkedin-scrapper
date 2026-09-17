import * as leadRepo from "../repository/lead.repository";
import * as snapshotRepo from "../repository/leadSnapshot.repository";
import { extractPublicIdentifier } from "../domain/lead.schema";
import { SnapshotKind } from "@/generated/prisma/enums";
import { SELECTORS_VERSION } from "@/scraper/extract/selectors";
import type { SearchResultRow } from "@/scraper/extract/searchResult.extract";

export interface UpsertResult {
  leadId: string;
  isNew: boolean;
}

/** Invariant #7: every parsed field write is paired with a LeadSnapshot — a per-row capture
 * since LeadSnapshot.leadId is NOT NULL and a page-level capture can't span multiple leads. */
export async function upsertLeadFromSearchResult(params: {
  row: SearchResultRow;
  runId: string;
  page: number;
  position: number;
}): Promise<UpsertResult | null> {
  const { row, runId, page, position } = params;
  const publicIdentifier = extractPublicIdentifier(row.profileUrl);
  if (!publicIdentifier) return null;

  const before = await leadRepo.findByPublicIdentifier(publicIdentifier);
  const lead = await leadRepo.upsertStub({
    publicIdentifier,
    profileUrl: row.profileUrl,
    fullName: row.fullName,
    headline: row.headline,
    location: row.location,
    firstSeenRunId: runId,
  });

  await leadRepo.attachToRun(runId, lead.id, page, position);
  await snapshotRepo.create({
    leadId: lead.id,
    runId,
    kind: SnapshotKind.SEARCH_RESULT,
    html: row.rowHtml,
    selectorsVersion: SELECTORS_VERSION,
    parsed: row,
  });

  return { leadId: lead.id, isNew: !before };
}
