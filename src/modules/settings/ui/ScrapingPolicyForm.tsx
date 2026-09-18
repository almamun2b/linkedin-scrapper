"use client";

import { useActionState } from "react";
import type { ScrapingPolicySettings } from "../repository/settings.repository";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { updateScrapingPolicyAction } from "../actions";
import { DelayFields } from "./policy/DelayFields";
import { QuotaFields } from "./policy/QuotaFields";
import { ActiveHoursFields } from "./policy/ActiveHoursFields";
import { TogglesFields } from "./policy/TogglesFields";

/** One global policy for every LinkedIn account this system scrapes with — there is no
 * per-account override anymore (ScrapingPolicy is now a singleton row, id "global"). */
export function ScrapingPolicyForm({ policy }: { policy: ScrapingPolicySettings }) {
  const [state, formAction, pending] = useActionState(updateScrapingPolicyAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <DelayFields policy={policy} />
      <QuotaFields policy={policy} />
      <ActiveHoursFields policy={policy} />
      <TogglesFields policy={policy} />
      <Button type="submit" loading={pending} className="self-start">
        {pending ? "Saving…" : "Save policy"}
      </Button>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">Saved. The worker picks this up within 30 seconds.</Alert> : null}
    </form>
  );
}
