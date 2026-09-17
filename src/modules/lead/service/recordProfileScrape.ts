import * as leadRepo from "../repository/lead.repository";
import * as snapshotRepo from "../repository/leadSnapshot.repository";
import { parseCurrentPosition } from "../domain/parseCurrentPosition";
import { EmailSource, SnapshotKind } from "@/generated/prisma/enums";
import { SELECTORS_VERSION } from "@/scraper/extract/selectors";
import type { ProfileFields } from "@/scraper/extract/profile.extract";
import type { ContactInfoFields } from "@/scraper/extract/contactInfo.extract";

export async function recordProfileScrape(params: {
  publicIdentifier: string;
  runId: string;
  profileHtml: string;
  fields: ProfileFields;
  contactInfoHtml?: string;
  contactInfo?: ContactInfoFields;
}): Promise<void> {
  const { publicIdentifier, runId, profileHtml, fields, contactInfoHtml, contactInfo } = params;
  const lead = await leadRepo.findByPublicIdentifier(publicIdentifier);
  if (!lead) return;

  const { title, company } = parseCurrentPosition(fields.currentPosition);

  await snapshotRepo.create({
    leadId: lead.id,
    runId,
    kind: SnapshotKind.PROFILE,
    html: profileHtml,
    selectorsVersion: SELECTORS_VERSION,
    parsed: fields,
  });

  if (contactInfoHtml && contactInfo) {
    await snapshotRepo.create({
      leadId: lead.id,
      runId,
      kind: SnapshotKind.CONTACT_INFO,
      html: contactInfoHtml,
      selectorsVersion: SELECTORS_VERSION,
      parsed: contactInfo,
    });
  }

  await leadRepo.recordScrape(publicIdentifier, {
    fullName: fields.fullName,
    headline: fields.headline,
    location: fields.location,
    currentTitle: title,
    currentCompany: company,
    email: contactInfo?.email ?? undefined,
    emailSource: contactInfo?.email ? EmailSource.LINKEDIN_CONTACT_INFO : undefined,
    emailConfidence: contactInfo?.email ? 100 : undefined,
    websiteUrl: contactInfo?.websiteUrl ?? undefined,
  });
}
