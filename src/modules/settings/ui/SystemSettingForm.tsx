"use client";

import { useActionState } from "react";
import type { SystemSettingModel } from "@/generated/prisma/models/SystemSetting";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { Select } from "@/components/ui/form/Select";
import { FormSection } from "@/components/ui/form/FormSection";
import { LOG_LEVELS } from "../domain/settings.schema";
import { SYSTEM_SETTING_HELP } from "../domain/settingsHelp";
import { updateSystemSettingAction } from "../actions";

export function SystemSettingForm({ setting }: { setting: SystemSettingModel }) {
  const [state, formAction, pending] = useActionState(updateSystemSettingAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormSection title="Worker identity" description="Applied by the worker on its next settings poll (~30s), not a live restart.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Default worker id" help={SYSTEM_SETTING_HELP.workerId}>
            <Input name="workerId" defaultValue={setting.workerId} required />
          </Field>
          <Field label="Concurrency" help={SYSTEM_SETTING_HELP.workerConcurrency}>
            <Input name="workerConcurrency" type="number" min={1} max={32} defaultValue={setting.workerConcurrency} required />
          </Field>
          <Field label="Queues (comma-separated)" help={SYSTEM_SETTING_HELP.workerQueues}>
            <Input name="workerQueues" defaultValue={setting.workerQueues} required />
          </Field>
          <Field label="Display timezone (IANA id)" help={SYSTEM_SETTING_HELP.displayTimezone}>
            <Input name="displayTimezone" defaultValue={setting.displayTimezone} required />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Queue timing">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Poll interval (ms)" help={SYSTEM_SETTING_HELP.pollIntervalMs}>
            <Input name="pollIntervalMs" type="number" defaultValue={setting.pollIntervalMs} required />
          </Field>
          <Field label="Lease (s)" help={SYSTEM_SETTING_HELP.leaseSeconds}>
            <Input name="leaseSeconds" type="number" defaultValue={setting.leaseSeconds} required />
          </Field>
          <Field label="Lease heartbeat (ms)" help={SYSTEM_SETTING_HELP.leaseHeartbeatMs}>
            <Input name="leaseHeartbeatMs" type="number" defaultValue={setting.leaseHeartbeatMs} required />
          </Field>
          <Field label="Shutdown grace (ms)" help={SYSTEM_SETTING_HELP.shutdownGraceMs}>
            <Input name="shutdownGraceMs" type="number" defaultValue={setting.shutdownGraceMs} required />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Logging">
        <Field label="Log level" help={SYSTEM_SETTING_HELP.logLevel} className="max-w-40">
          <Select name="logLevel" defaultValue={setting.logLevel}>
            {LOG_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
        </Field>
      </FormSection>

      <Button type="submit" loading={pending} className="self-start">
        {pending ? "Saving…" : "Save settings"}
      </Button>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">Saved.</Alert> : null}
    </form>
  );
}
