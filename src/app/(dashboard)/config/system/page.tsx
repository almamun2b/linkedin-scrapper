import { Alert } from "@/components/ui/Alert";
import { getSystemSetting } from "@/modules/settings/service/getEffectiveSettings";
import { SystemSettingForm } from "@/modules/settings/ui/SystemSettingForm";

export default async function SystemPage() {
  const setting = await getSystemSetting();

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Alert tone="info">
        Worker and queue-timing settings, moved here from <code>.env</code>. A running worker
        re-reads these on its own ~30s poll, so a save applies without a restart — it is not
        instant. <code>DATABASE_URL</code>, <code>ENCRYPTION_KEY</code>, <code>AUTH_SECRET</code>,
        and the process timezone still live in <code>.env</code> because they have to be
        readable before this database can be queried at all; see{" "}
        <code>docs/configuration.md</code>.
      </Alert>
      <SystemSettingForm setting={setting} />
    </div>
  );
}
