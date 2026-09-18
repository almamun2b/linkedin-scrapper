-- Hand-edited (schema-change skill): preserves the existing ScrapingPolicy row's tuned
-- values instead of dropping and recreating the table, and adds CHECK(id = 'global') to
-- both new singletons — Prisma's schema language can't express a pinned-id singleton
-- constraint declaratively (same reason the init migration hand-adds its delay-order CHECKs).

-- ScrapingPolicy: collapse per-account rows into one singleton row -----------------------

-- Promote the most-recently-updated row to the singleton id. If more than one
-- LinkedInAccount had its own policy row, the others are dropped here — a deliberate
-- collapse (this system runs one operator, one pacing policy), not data loss anyone
-- depended on distinguishing.
UPDATE "ScrapingPolicy"
SET "id" = 'global'
WHERE "id" = (SELECT "id" FROM "ScrapingPolicy" ORDER BY "updatedAt" DESC LIMIT 1);

DELETE FROM "ScrapingPolicy" WHERE "id" != 'global';

-- DropForeignKey
ALTER TABLE "ScrapingPolicy" DROP CONSTRAINT IF EXISTS "ScrapingPolicy_linkedInAccountId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "ScrapingPolicy_linkedInAccountId_key";

-- AlterTable
ALTER TABLE "ScrapingPolicy"
  DROP COLUMN IF EXISTS "linkedInAccountId",
  ALTER COLUMN "id" DROP DEFAULT,
  ADD COLUMN "fallbackProxyUrlSealed" BYTEA,
  ADD COLUMN "fallbackProxyUrlKeyVer" INTEGER,
  ADD COLUMN "proxyCountry" TEXT;

ALTER TABLE "ScrapingPolicy" ALTER COLUMN "id" SET DEFAULT 'global';

-- AddCheck: exactly one row, ever.
ALTER TABLE "ScrapingPolicy" ADD CONSTRAINT "ScrapingPolicy_id_check" CHECK ("id" = 'global');

-- No row existed yet (a fresh database, seed not yet run) — insert the column defaults now
-- that `linkedInAccountId` is gone, so the table is never briefly without its one required
-- row. Ordered after the column drop: with that column still NOT NULL, this INSERT would
-- fail its own row-construction check before ON CONFLICT ever gets a chance to skip it.
INSERT INTO "ScrapingPolicy" ("id")
VALUES ('global')
ON CONFLICT ("id") DO NOTHING;

-- JobArtifact -----------------------------------------------------------------------------

-- CreateEnum
CREATE TYPE "JobArtifactKind" AS ENUM ('SCREENSHOT', 'HTML');

-- CreateTable
CREATE TABLE "JobArtifact" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "kind" "JobArtifactKind" NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "capturedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobArtifact_jobId_capturedAt_idx" ON "JobArtifact"("jobId", "capturedAt");

-- AddForeignKey
ALTER TABLE "JobArtifact" ADD CONSTRAINT "JobArtifact_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SystemSetting -----------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "workerId" TEXT NOT NULL DEFAULT 'worker-local-1',
    "workerConcurrency" INTEGER NOT NULL DEFAULT 1,
    "workerQueues" TEXT NOT NULL DEFAULT 'default',
    "pollIntervalMs" INTEGER NOT NULL DEFAULT 2000,
    "leaseSeconds" INTEGER NOT NULL DEFAULT 900,
    "leaseHeartbeatMs" INTEGER NOT NULL DEFAULT 60000,
    "shutdownGraceMs" INTEGER NOT NULL DEFAULT 30000,
    "logLevel" TEXT NOT NULL DEFAULT 'info',
    "displayTimezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- AddCheck: exactly one row, ever.
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_id_check" CHECK ("id" = 'global');

-- Seed the singleton immediately with column defaults, mirroring today's .env values, so
-- the table is never briefly without its one required row (prisma/seed.ts upserts over
-- this idempotently on every run).
INSERT INTO "SystemSetting" ("id", "updatedAt")
VALUES ('global', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
