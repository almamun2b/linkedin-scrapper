import { z } from "zod";

/** A resolved LinkedIn typeahead entry — a human label paired with the opaque URN it maps to. */
export const filterRefValueSchema = z.object({
  label: z.string().min(1),
  urn: z.string().min(1),
});
export type FilterRefValue = z.infer<typeof filterRefValueSchema>;

export const connectionDegreeSchema = z.enum(["1", "2", "3+"]);
export type ConnectionDegree = z.infer<typeof connectionDegreeSchema>;

/**
 * Only keywords/connectionDegree/locations/currentCompanies are resolved and wired into
 * buildSearchUrl for this pass (the user's confirmed "core now" filter scope). Every other
 * facet below is reserved — shape-validated so the JSON column never breaks, but not yet
 * resolved by any typeahead flow or read by buildSearchUrl. Adding real support for one later
 * is additive: no migration, no change to this schema's shape.
 */
export const searchFiltersSchema = z.object({
  keywords: z.string().trim().max(200).optional(),
  connectionDegree: z.array(connectionDegreeSchema).optional(),
  locations: z.array(filterRefValueSchema).optional(),
  currentCompanies: z.array(filterRefValueSchema).optional(),

  // Reserved — "All filters" UI shows these as coming soon; see write-extractor/add-job-type
  // notes on search.typeahead.resolve for why these can't be wired without a live LinkedIn
  // devtools capture the human has to supply.
  pastCompanies: z.array(filterRefValueSchema).optional(),
  schools: z.array(filterRefValueSchema).optional(),
  industries: z.array(filterRefValueSchema).optional(),
  serviceCategories: z.array(filterRefValueSchema).optional(),
  connectionsOf: z.array(filterRefValueSchema).optional(),
  followersOf: z.array(filterRefValueSchema).optional(),
  profileLanguages: z.array(z.string()).optional(),
  openToVolunteering: z.boolean().optional(),
});
export type SearchFilters = z.infer<typeof searchFiltersSchema>;

export const WIRED_FILTER_KEYS = ["keywords", "connectionDegree", "locations", "currentCompanies"] as const;

export const COMING_SOON_FILTERS = [
  { key: "pastCompanies", label: "Past companies" },
  { key: "schools", label: "Schools" },
  { key: "industries", label: "Industries" },
  { key: "serviceCategories", label: "Service categories" },
  { key: "connectionsOf", label: "Connections of" },
  { key: "followersOf", label: "Followers of" },
  { key: "profileLanguages", label: "Profile languages" },
  { key: "openToVolunteering", label: "Open to volunteering" },
] as const;
