"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/Button";
import { startRunAction } from "../actions";

export function RunNowButton({ searchDefinitionId }: { searchDefinitionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          const formData = new FormData();
          formData.set("searchDefinitionId", searchDefinitionId);
          startTransition(async () => {
            const result = await startRunAction(formData);
            if (result.error) {
              setError(result.error);
              return;
            }
            router.push("/runs");
          });
        }}
      >
        {pending ? "Starting…" : "Run now"}
      </Button>
      {error ? <p className="text-xs text-[--color-danger]">{error}</p> : null}
    </div>
  );
}
