import { prisma } from "@/server/db/prisma";
import type { ProxyProtocol } from "@/generated/prisma/enums";

/**
 * Worker-only — opts back into the sealed password column. The rest of the proxy slice
 * (domain/service/actions/ui) is deferred to the /config stage; nothing else needs it while
 * USE_PROXY=false and no Proxy rows exist yet.
 */
export async function findForWorker(id: string) {
  return prisma.proxy.findUnique({
    where: { id },
    omit: { passwordSealed: false },
  });
}

/** Web-safe: sealed columns stay excluded via the client-level `omit`. */
export async function list() {
  return prisma.proxy.findMany({ orderBy: { createdAt: "desc" } });
}

export type ProxyListItem = Awaited<ReturnType<typeof list>>[number];

export async function findById(id: string) {
  return prisma.proxy.findUnique({ where: { id } });
}

export interface CreateProxyInput {
  label: string;
  protocol: ProxyProtocol;
  host: string;
  port: number;
  username?: string | null;
  passwordSealed?: Uint8Array<ArrayBuffer> | null;
  passwordKeyVer?: number | null;
  country?: string | null;
}

export async function create(input: CreateProxyInput) {
  return prisma.proxy.create({ data: input });
}

export interface UpdateProxyInput {
  label?: string;
  protocol?: ProxyProtocol;
  host?: string;
  port?: number;
  username?: string | null;
  passwordSealed?: Uint8Array<ArrayBuffer> | null;
  passwordKeyVer?: number | null;
  country?: string | null;
}

export async function update(id: string, patch: UpdateProxyInput) {
  return prisma.proxy.update({ where: { id }, data: patch });
}

export async function setActive(id: string, active: boolean) {
  return prisma.proxy.update({ where: { id }, data: { active } });
}

export async function countAccountsUsing(id: string) {
  return prisma.linkedInAccount.count({ where: { proxyId: id } });
}
