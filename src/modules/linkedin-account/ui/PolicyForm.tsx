"use client";

import { useActionState } from "react";
import type { ScrapingPolicyModel } from "@/generated/prisma/models/ScrapingPolicy";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { updatePolicyAction } from "../actions";
import { DelayFields } from "./policy/DelayFields";
import { QuotaFields } from "./policy/QuotaFields";
import { ActiveHoursFields } from "./policy/ActiveHoursFields";
import { TogglesFields } from "./policy/TogglesFields";

export function PolicyForm({ policy }: { policy: ScrapingPolicyModel }) {
  const [state, formAction, pending] = useActionState(updatePolicyAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="linkedInAccountId" value={policy.linkedInAccountId} />
      <DelayFields policy={policy} />
      <QuotaFields policy={policy} />
      <ActiveHoursFields policy={policy} />
      <TogglesFields policy={policy} />
      <Button type="submit" loading={pending} className="self-start">
        {pending ? "Saving…" : "Save policy"}
      </Button>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
    </form>
  );
}
