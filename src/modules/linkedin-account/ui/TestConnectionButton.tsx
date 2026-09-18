"use client";

import { useTransition } from "react";
import { PlugZap } from "lucide-react";
import { IconAction } from "@/components/ui/RowActions";
import { toast } from "@/components/ui/Toaster";
import { testConnectionAction } from "../actions";

export function TestConnectionButton({ accountId }: { accountId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <IconAction
      icon={<PlugZap aria-hidden="true" className="size-4" />}
      label={pending ? "Queuing test connection…" : "Test connection"}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          try {
            const result = await testConnectionAction(accountId);
            if (result.queued) {
              toast.success("Test connection queued — check /jobs for progress.");
            } else {
              toast.warning("A test connection is already queued for this hour.");
            }
          } catch {
            toast.error("Something went wrong — check the server logs.");
          }
        });
      }}
    />
  );
}
