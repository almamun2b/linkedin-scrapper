"use server";

import { revalidatePath } from "next/cache";
import { formString } from "@/lib/formData";
import { requireRole } from "@/modules/auth/service/requireRole";
import * as auditRepo from "../audit/repository/auditEvent.repository";
import { retryDeadJob as retryDeadJobService } from "./service/queue.service";

export async function retryDeadJobAction(formData: FormData): Promise<void> {
  const actor = await requireRole("OPERATOR");
  const jobId = formString(formData, "jobId");
  const retried = await retryDeadJobService(jobId);
  if (retried) {
    await auditRepo.record({
      actorId: actor.id,
      action: "job.retried",
      entity: "Job",
      entityId: jobId,
    });
  }
  revalidatePath("/jobs");
}
