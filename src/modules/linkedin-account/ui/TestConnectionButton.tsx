"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/Button";
import { testConnectionAction } from "../actions";

export function TestConnectionButton({ accountId }: { accountId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await testConnectionAction(accountId);
            setMessage(
              result.queued
                ? "Queued — the worker will process this on its own pace. Check /jobs for progress."
                : "Already queued this hour.",
            );
          })
        }
      >
        {pending ? "Queuing…" : "Test connection"}
      </Button>
      {message ? <p className="text-xs text-[--color-muted]">{message}</p> : null}
    </div>
  );
}
