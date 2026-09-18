import { Pool } from "pg";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env";

// This database's session TimeZone defaults to a non-UTC zone (observed: Asia/Dhaka). That
// silently breaks any client-side comparison against `new Date()` — e.g. the queue reaper's
// `leaseExpiresAt < now`, or an active-hours window check — because Prisma's Date parameter
// serialization does not account for a non-UTC session offset, even though the underlying
// timestamptz values are stored correctly. `options` is a startup-packet parameter (applied
// before the connection is usable, unlike a post-connect `SET` query), so this removes the
// footgun at the source with no race to guard against. See ARCHITECTURE.md §4's timestamptz note.
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  options: "-c timezone=UTC",
});

const adapter = new PrismaPg(pool);

// Sealed secrets and password hashes are never selected by default. A repository that genuinely
// needs one (worker-only) opts back in per query with `omit: { passwordSealed: false }`.
const prisma = new PrismaClient({
  adapter,
  omit: {
    user: { passwordHash: true },
    linkedInAccount: { passwordSealed: true, storageStateSealed: true },
    proxy: { passwordSealed: true },
    scrapingPolicy: { fallbackProxyUrlSealed: true },
  },
});

export { prisma };
export default prisma;
