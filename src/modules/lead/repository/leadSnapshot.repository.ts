import { gzipSync } from "node:zlib";
import { prisma } from "@/server/db/prisma";
import type { SnapshotKind } from "@/generated/prisma/enums";

export interface CreateSnapshotInput {
  leadId: string;
  runId?: string | null;
  kind: SnapshotKind;
  html: string;
  selectorsVersion?: string;
  parsed?: unknown;
}

/** Gzips and computes byteSize once, here — the one shared place both search.page.fetch and
 * profile.scrape call into, instead of each handler inlining its own gzip call. */
export async function create(input: CreateSnapshotInput) {
  const gzipped = gzipSync(Buffer.from(input.html, "utf8"));
  return prisma.leadSnapshot.create({
    data: {
      leadId: input.leadId,
      runId: input.runId,
      kind: input.kind,
      html: Uint8Array.from(gzipped),
      byteSize: gzipped.byteLength,
      selectorsVersion: input.selectorsVersion,
      parsed: input.parsed as never,
    },
  });
}
