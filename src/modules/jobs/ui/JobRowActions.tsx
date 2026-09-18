"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Play, Trash2 } from "lucide-react";
import type { JobModel } from "@/generated/prisma/models/Job";
import { toast } from "@/components/ui/Toaster";
import { isScheduledForLater } from "../domain/isScheduledForLater";
import { IconAction, RowActions } from "@/components/ui/RowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { retryDeadJobAction, runJobNowAction, deleteJobAction } from "../actions";

/** Status-driven: retry on a terminal failure, run-now on a job still waiting for its
 * `runAt`, delete on anything not actively claimed by a worker. Retry/Run now are plain
 * `void`-returning actions with no state of their own, so this is the one place their
 * result becomes visible at all — a toast, since neither has a dialog to report into. */
export function JobRowActions({ job }: { job: JobModel }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const canRetry = job.status === "DEAD" || job.status === "FAILED";
  const canRunNow = job.status === "QUEUED" && isScheduledForLater(new Date(job.runAt));
  const canDelete = job.status !== "RUNNING";

  function runVoidAction(action: (formData: FormData) => Promise<void>, successMessage: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("jobId", job.id);
      try {
        await action(formData);
        toast.success(successMessage);
      } catch {
        toast.error("Something went wrong — check the server logs.");
      }
    });
  }

  return (
    <RowActions>
      {canRetry ? (
        <IconAction
          icon={<RotateCcw aria-hidden="true" className="size-4" />}
          label="Retry"
          disabled={pending}
          onClick={() => { runVoidAction(retryDeadJobAction, "Job requeued."); }}
        />
      ) : null}
      {canRunNow ? (
        <IconAction
          icon={<Play aria-hidden="true" className="size-4" />}
          label="Run now"
          disabled={pending}
          onClick={() => { runVoidAction(runJobNowAction, "Job will run on the next poll."); }}
        />
      ) : null}
      {canDelete ? (
        <>
          <IconAction
            icon={<Trash2 aria-hidden="true" className="size-4" />}
            label="Delete job"
            tone="danger"
            onClick={() => { setDeleteOpen(true); }}
          />
          <ConfirmDialog
            open={deleteOpen}
            onClose={() => { setDeleteOpen(false); }}
            onConfirm={() => {
              startTransition(async () => {
                const formData = new FormData();
                formData.set("jobId", job.id);
                await deleteJobAction(formData);
                setDeleteOpen(false);
                toast.success("Job deleted.");
              });
            }}
            title="Delete this job?"
            body="This removes the job and its logs. This cannot be undone."
            confirmLabel="Delete job"
            pending={pending}
          />
        </>
      ) : null}
    </RowActions>
  );
}
