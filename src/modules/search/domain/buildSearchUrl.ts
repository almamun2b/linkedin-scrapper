import type { SearchFilters } from "./filters";

const NETWORK_CODE: Record<string, string> = { "1": "F", "2": "S", "3+": "O" };
const SEARCH_BASE = "https://www.linkedin.com/search/results/people/";

/**
 * Pure — no I/O. Only emits params for the wired facets (keywords/connectionDegree/
 * locations/currentCompanies); a populated-but-unwired reserved field (see filters.ts) is
 * silently ignored rather than thrown on, since the UI disables them but a stale
 * SearchDefinition row predating a schema change could still carry one.
 */
export function buildSearchUrl(filters: SearchFilters, page: number): string {
  const params = new URLSearchParams();

  if (filters.keywords) {
    params.set("keywords", filters.keywords);
  }
  if (filters.connectionDegree?.length) {
    const codes = filters.connectionDegree.map((d) => NETWORK_CODE[d]).filter(Boolean);
    if (codes.length) params.set("network", JSON.stringify(codes));
  }
  if (filters.locations?.length) {
    params.set("geoUrn", JSON.stringify(filters.locations.map((l) => l.urn)));
  }
  if (filters.currentCompanies?.length) {
    params.set("currentCompany", JSON.stringify(filters.currentCompanies.map((c) => c.urn)));
  }
  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `${SEARCH_BASE}?${query}` : SEARCH_BASE;
}
