import { prisma } from "@/server/db/prisma";
import type { SearchFilters } from "../domain/filters";

export interface CreateSearchDefinitionInput {
  name: string;
  linkedInAccountId: string;
  keywords?: string;
  filters: SearchFilters;
  maxPages?: number;
  createdById?: string | null;
}

export async function list() {
  return prisma.searchDefinition.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function findById(id: string) {
  return prisma.searchDefinition.findUnique({ where: { id } });
}

export async function create(input: CreateSearchDefinitionInput) {
  return prisma.searchDefinition.create({
    data: {
      name: input.name,
      linkedInAccountId: input.linkedInAccountId,
      keywords: input.keywords,
      filters: input.filters as never,
      maxPages: input.maxPages,
      createdById: input.createdById ?? null,
    },
  });
}

export interface UpdateSearchDefinitionPatch {
  name?: string;
  keywords?: string | null;
  filters?: SearchFilters;
  maxPages?: number;
  enabled?: boolean;
}

export async function update(id: string, patch: UpdateSearchDefinitionPatch) {
  return prisma.searchDefinition.update({
    where: { id },
    data: { ...patch, filters: patch.filters as never },
  });
}

export async function archive(id: string) {
  return prisma.searchDefinition.update({
    where: { id },
    data: { archivedAt: new Date(), enabled: false },
  });
}
