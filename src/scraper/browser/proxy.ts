import { err, ok, type Result } from "@/server/result";

export interface ScraperProxy {
  server: string;
  username?: string;
  password?: string;
}

export interface ProxyCandidate {
  protocol: "HTTP" | "HTTPS" | "SOCKS5";
  host: string;
  port: number;
  username: string | null;
  password: string | null;
}

export interface ProxyResolutionError {
  kind: "unresolvable";
}

/**
 * `useProxy: false` -> ok(null): launch.ts must omit the `proxy` launch option entirely,
 * never pass `{}`. `useProxy: true` resolves the account's assigned proxy, else `proxyUrl`,
 * else err(...) — the caller turns that into a FatalError. Never falls back to a direct
 * connection (CLAUDE.md invariant #9).
 */
export function resolveProxy(params: {
  useProxy: boolean;
  accountProxy: ProxyCandidate | null;
  proxyUrl: string | null;
}): Result<ScraperProxy | null, ProxyResolutionError> {
  if (!params.useProxy) {
    return ok(null);
  }
  if (params.accountProxy) {
    const { protocol, host, port, username, password } = params.accountProxy;
    return ok({
      server: `${protocol.toLowerCase()}://${host}:${port}`,
      username: username ?? undefined,
      password: password ?? undefined,
    });
  }
  if (params.proxyUrl) {
    return ok({ server: params.proxyUrl });
  }
  return err({ kind: "unresolvable" });
}
