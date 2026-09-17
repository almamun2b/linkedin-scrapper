import { prisma } from "@/server/db/prisma";

export interface RecordAuditEventInput {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  data?: unknown;
}

export async function record(input: RecordAuditEventInput): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      data: (input.data ?? null) as never,
    },
  });
}
