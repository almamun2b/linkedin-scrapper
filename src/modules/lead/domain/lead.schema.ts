import { z } from "zod";

/** LinkedIn profile URLs look like https://www.linkedin.com/in/some-slug-123/ — the slug,
 * normalized lowercase, is the natural key (ARCHITECTURE §7). */
export function extractPublicIdentifier(profileUrl: string): string | null {
  const match = /\/in\/([^/?#]+)/i.exec(profileUrl);
  return match ? decodeURIComponent(match[1] ?? "").toLowerCase() : null;
}

export const searchResultLeadSchema = z.object({
  profileUrl: z.url(),
  fullName: z.string().nullable(),
  headline: z.string().nullable(),
  location: z.string().nullable(),
});
export type SearchResultLead = z.infer<typeof searchResultLeadSchema>;
