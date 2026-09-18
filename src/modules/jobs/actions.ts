"use server";

import { revalidatePath } from "next/cache";
import { formString } from "@/lib/formData";
import { requireRole } from "@/modules/auth/service/requireRole";
import * as auditRepo from "../audit/repository/auditEvent.repository";
import {
  retryDeadJob as retryDeadJobService,
  runJobNow as runJobNowService,
  deleteJob as deleteJobService,
} from "./service/queue.service";

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

export async function runJobNowAction(formData: FormData): Promise<void> {
  const actor = await requireRole("OPERATOR");
  const jobId = formString(formData, "jobId");
  const ran = await runJobNowService(jobId);
  if (ran) {
    await auditRepo.record({
      actorId: actor.id,
      action: "job.run_now",
      entity: "Job",
      entityId: jobId,
    });
  }
  revalidatePath("/jobs");
}

export async function deleteJobAction(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const jobId = formString(formData, "jobId");
  const deleted = await deleteJobService(jobId);
  if (deleted) {
    await auditRepo.record({
      actorId: actor.id,
      action: "job.deleted",
      entity: "Job",
      entityId: jobId,
    });
  }
  revalidatePath("/jobs");
}
