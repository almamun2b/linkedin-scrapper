import * as proxyRepo from "@/modules/proxy/repository/proxy.repository";
import { AddProxyButton } from "@/modules/proxy/ui/AddProxyButton";
import { ProxyTable } from "@/modules/proxy/ui/ProxyTable";

export default async function ProxiesPage() {
  const proxies = await proxyRepo.list();
  const counts = Object.fromEntries(
    await Promise.all(
      proxies.map(async (p) => [p.id, await proxyRepo.countAccountsUsing(p.id)] as const),
    ),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddProxyButton />
      </div>
      <ProxyTable proxies={proxies} accountCounts={counts} />
    </div>
  );
}
