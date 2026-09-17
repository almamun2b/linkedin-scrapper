import { gunzipSync } from "node:zlib";
import { prisma } from "@/server/db/prisma";
import { SnapshotKind } from "@/generated/prisma/enums";
import { extractSearchResults } from "@/scraper/extract/searchResult.extract";
import { extractProfileFields } from "@/scraper/extract/profile.extract";
import { extractContactInfo } from "@/scraper/extract/contactInfo.extract";

/**
 * The offline "fix a selector, replay stored evidence" loop the write-extractor skill
 * promises: reads stored LeadSnapshot rows, re-runs the CURRENT extractors over the gzipped
 * HTML, and diffs against what's on file. Never touches the network (invariant #10).
 * Dry-run by default; --apply writes reparsed fields back onto Lead.
 */
async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const kindArg = args.find((a) => a.startsWith("--kind="))?.split("=")[1];
  const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const limit = limitArg ? Number(limitArg) : 50;

  const snapshots = await prisma.leadSnapshot.findMany({
    where: kindArg ? { kind: kindArg as SnapshotKind } : undefined,
    orderBy: { capturedAt: "desc" },
    take: limit,
    include: { lead: true },
  });

  console.log(
    `Reparsing ${snapshots.length} snapshot(s)${apply ? " (applying changes)" : " (dry run)"}...`,
  );

  for (const snapshot of snapshots) {
    const html = gunzipSync(Buffer.from(snapshot.html)).toString("utf8");
    const diff = reparseOne(snapshot.kind, html, snapshot.lead);
    if (diff) {
      console.log(`Lead ${snapshot.lead.publicIdentifier} [${snapshot.kind}]:`, diff);
      if (apply) {
        await prisma.lead.update({
          where: { id: snapshot.leadId },
          data: { ...diff, lastScrapedAt: new Date() },
        });
      }
    }
  }

  console.log("Done.");
}

function reparseOne(
  kind: SnapshotKind,
  html: string,
  lead: { fullName: string | null; email: string | null },
) {
  if (kind === SnapshotKind.PROFILE) {
    const fields = extractProfileFields(html);
    return fields.fullName !== lead.fullName ? { fullName: fields.fullName } : null;
  }
  if (kind === SnapshotKind.CONTACT_INFO) {
    const info = extractContactInfo(html);
    return info.email !== lead.email ? { email: info.email } : null;
  }
  if (kind === SnapshotKind.SEARCH_RESULT) {
    const [firstRow] = extractSearchResults(html);
    return firstRow && firstRow.fullName !== lead.fullName ? { fullName: firstRow.fullName } : null;
  }
  return null;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
