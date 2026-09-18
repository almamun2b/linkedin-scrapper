import type { ProxyListItem } from "@/modules/proxy/repository/proxy.repository";
import { Field } from "@/components/ui/form/Field";
import { Select } from "@/components/ui/form/Select";

/** Shared proxy picker for the Add and Edit account forms — one place to change the
 * option label, the empty state, and the "none" sentinel both actions map to null. */
export function ProxySelectField({
  proxies,
  defaultValue,
}: {
  proxies: ProxyListItem[];
  defaultValue?: string | null;
}) {
  return (
    <Field
      label="Proxy"
      hint={
        proxies.length === 0 ? "No proxies yet — add one at /config/proxies." : undefined
      }
    >
      <Select name="proxyId" defaultValue={defaultValue ?? "none"}>
        <option value="none">None (direct connection)</option>
        {proxies.map((proxy) => (
          <option key={proxy.id} value={proxy.id}>
            {proxy.label} ({proxy.host}:{proxy.port}){proxy.active ? "" : " — inactive"}
          </option>
        ))}
      </Select>
    </Field>
  );
}
