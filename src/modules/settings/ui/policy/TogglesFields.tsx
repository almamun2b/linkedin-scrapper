import type { ScrapingPolicySettings } from "../../repository/settings.repository";
import { Checkbox } from "@/components/ui/form/Checkbox";
import { FormSection } from "@/components/ui/form/FormSection";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { SCRAPING_POLICY_HELP } from "../../domain/settingsHelp";

export function TogglesFields({ policy }: { policy: ScrapingPolicySettings }) {
  return (
    <FormSection title="Toggles & fallback proxy">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <Checkbox
            name="useProxy"
            defaultChecked={policy.useProxy}
            label="Use proxy"
            help={SCRAPING_POLICY_HELP.useProxy}
          />
          <Checkbox
            name="headless"
            defaultChecked={policy.headless}
            label="Headless browser"
            help={SCRAPING_POLICY_HELP.headless}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Fallback proxy URL"
            help={SCRAPING_POLICY_HELP.fallbackProxyUrl}
            hint="Leave blank to keep the current one. Sealed at rest."
          >
            <Input name="fallbackProxyUrl" type="password" placeholder="http://user:pass@host:port" />
          </Field>
          <Field label="Proxy country hint" help={SCRAPING_POLICY_HELP.proxyCountry}>
            <Input name="proxyCountry" defaultValue={policy.proxyCountry ?? undefined} placeholder="US" />
          </Field>
        </div>
      </div>
    </FormSection>
  );
}
