"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { createAccountAction } from "../actions";

export function AccountForm() {
  const [state, formAction, pending] = useActionState(createAccountAction, {});

  return (
    <Card className="max-w-md">
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3">
          <Field label="Label">
            <Input name="label" defaultValue="primary" required />
          </Field>
          <Field label="LinkedIn email">
            <Input name="email" type="email" required />
          </Field>
          <Field label="LinkedIn password">
            <Input name="password" type="password" required />
          </Field>
          <Field label="Timezone (IANA id)">
            <Input name="timezone" defaultValue="UTC" required />
          </Field>
          <Button type="submit" loading={pending} className="self-start">
            {pending ? "Adding…" : "Add LinkedIn account"}
          </Button>
          {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        </form>
      </CardContent>
    </Card>
  );
}
