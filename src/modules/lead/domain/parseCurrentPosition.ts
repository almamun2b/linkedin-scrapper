export interface ParsedPosition {
  title: string | null;
  company: string | null;
}

/**
 * Splitting "Title at Company" is a Lead-shape business rule, not an HTML-parsing concern —
 * kept here rather than in the extractor, which stays a single opaque `currentPosition`
 * string per ARCHITECTURE §7's "extractors are pure over HTML, plain in/out" design.
 */
export function parseCurrentPosition(raw: string | null): ParsedPosition {
  if (!raw) return { title: null, company: null };
  const match = raw.match(/^(.*?)\s+at\s+(.+)$/i);
  if (!match) return { title: raw.trim(), company: null };
  return { title: match[1].trim(), company: match[2].trim() };
}
