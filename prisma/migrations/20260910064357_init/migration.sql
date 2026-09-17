-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('UNVERIFIED', 'ACTIVE', 'COOLING_DOWN', 'CHALLENGED', 'RESTRICTED', 'DISABLED');

-- CreateEnum
CREATE TYPE "ProxyProtocol" AS ENUM ('HTTP', 'HTTPS', 'SOCKS5');

-- CreateEnum
CREATE TYPE "ProxyHealth" AS ENUM ('UNKNOWN', 'HEALTHY', 'DEGRADED', 'DEAD');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'DEAD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "RateMetric" AS ENUM ('PROFILES_PER_DAY', 'SEARCH_PAGES_PER_DAY', 'PROFILES_PER_WEEK');

-- CreateEnum
CREATE TYPE "EmailSource" AS ENUM ('LINKEDIN_CONTACT_INFO', 'WEBSITE_SCRAPE', 'PATTERN_GUESS', 'MANUAL', 'IMPORT');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('STUB', 'SCRAPED', 'ENRICHED', 'FAILED');

-- CreateEnum
CREATE TYPE "SnapshotKind" AS ENUM ('SEARCH_RESULT', 'PROFILE', 'CONTACT_INFO', 'WEBSITE');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('QUEUED', 'RUNNING', 'PAUSED', 'SUCCEEDED', 'FAILED', 'HALTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FilterRefKind" AS ENUM ('GEO', 'INDUSTRY', 'COMPANY', 'SCHOOL', 'TITLE', 'LANGUAGE', 'SERVICE_CATEGORY', 'OTHER');

-- CreateTable
CREATE TABLE "LinkedInAccount" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordSealed" BYTEA NOT NULL,
    "passwordKeyVer" INTEGER NOT NULL DEFAULT 1,
    "storageStateSealed" BYTEA,
    "storageStateKeyVer" INTEGER,
    "storageStateAt" TIMESTAMPTZ(3),
    "fingerprint" JSONB NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "proxyId" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "statusReason" TEXT,
    "cooldownUntil" TIMESTAMPTZ(3),
    "lastLoginAt" TIMESTAMPTZ(3),
    "lastActivityAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LinkedInAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proxy" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "protocol" "ProxyProtocol" NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT,
    "passwordSealed" BYTEA,
    "passwordKeyVer" INTEGER,
    "country" TEXT,
    "sticky" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "health" "ProxyHealth" NOT NULL DEFAULT 'UNKNOWN',
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastCheckedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Proxy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapingPolicy" (
    "id" TEXT NOT NULL,
    "linkedInAccountId" TEXT NOT NULL,
    "stepDelayMinMs" INTEGER NOT NULL DEFAULT 4000,
    "stepDelayMaxMs" INTEGER NOT NULL DEFAULT 11000,
    "profileDelayMinMs" INTEGER NOT NULL DEFAULT 25000,
    "profileDelayMaxMs" INTEGER NOT NULL DEFAULT 90000,
    "pageDelayMinMs" INTEGER NOT NULL DEFAULT 45000,
    "pageDelayMaxMs" INTEGER NOT NULL DEFAULT 150000,
    "sessionBreakAfter" INTEGER NOT NULL DEFAULT 12,
    "sessionBreakMinMs" INTEGER NOT NULL DEFAULT 600000,
    "sessionBreakMaxMs" INTEGER NOT NULL DEFAULT 2700000,
    "maxProfilesPerDay" INTEGER NOT NULL DEFAULT 80,
    "maxSearchPagesPerDay" INTEGER NOT NULL DEFAULT 15,
    "maxProfilesPerWeek" INTEGER NOT NULL DEFAULT 350,
    "activeHoursStart" INTEGER NOT NULL DEFAULT 9,
    "activeHoursEnd" INTEGER NOT NULL DEFAULT 18,
    "activeOnWeekends" BOOLEAN NOT NULL DEFAULT false,
    "useProxy" BOOLEAN NOT NULL DEFAULT false,
    "headless" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ScrapingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "data" JSONB,
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMPTZ(3),
    "name" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "queue" TEXT NOT NULL DEFAULT 'default',
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "runAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lockedBy" TEXT,
    "lockedAt" TIMESTAMPTZ(3),
    "leaseExpiresAt" TIMESTAMPTZ(3),
    "cancelRequestedAt" TIMESTAMPTZ(3),
    "idempotencyKey" TEXT,
    "runId" TEXT,
    "linkedInAccountId" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "data" JSONB,
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateBudget" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "metric" "RateMetric" NOT NULL,
    "windowStart" TIMESTAMPTZ(3) NOT NULL,
    "windowEnd" TIMESTAMPTZ(3) NOT NULL,
    "consumed" INTEGER NOT NULL DEFAULT 0,
    "cap" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RateBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerHeartbeat" (
    "id" TEXT NOT NULL,
    "pid" INTEGER NOT NULL,
    "host" TEXT NOT NULL,
    "queues" TEXT[],
    "concurrency" INTEGER NOT NULL,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL,
    "stoppedAt" TIMESTAMPTZ(3),
    "version" TEXT NOT NULL,

    CONSTRAINT "WorkerHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "publicIdentifier" TEXT NOT NULL,
    "memberUrn" TEXT,
    "profileUrl" TEXT NOT NULL,
    "fullName" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "headline" TEXT,
    "location" TEXT,
    "currentTitle" TEXT,
    "currentCompany" TEXT,
    "companyDomain" TEXT,
    "websiteUrl" TEXT,
    "email" TEXT,
    "emailSource" "EmailSource",
    "emailConfidence" INTEGER,
    "stage" "LeadStage" NOT NULL DEFAULT 'STUB',
    "firstSeenRunId" TEXT,
    "scrapedAt" TIMESTAMPTZ(3),
    "enrichedAt" TIMESTAMPTZ(3),
    "lastScrapedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadSnapshot" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "runId" TEXT,
    "kind" "SnapshotKind" NOT NULL,
    "capturedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selectorsVersion" TEXT,
    "html" BYTEA NOT NULL,
    "encoding" TEXT NOT NULL DEFAULT 'gzip',
    "byteSize" INTEGER NOT NULL,
    "parsed" JSONB,

    CONSTRAINT "LeadSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunLead" (
    "runId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "firstSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunLead_pkey" PRIMARY KEY ("runId","leadId")
);

-- CreateTable
CREATE TABLE "SearchDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "linkedInAccountId" TEXT NOT NULL,
    "keywords" TEXT,
    "filters" JSONB NOT NULL,
    "maxPages" INTEGER NOT NULL DEFAULT 5,
    "cron" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMPTZ(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SearchDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapeRun" (
    "id" TEXT NOT NULL,
    "searchDefinitionId" TEXT NOT NULL,
    "linkedInAccountId" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMPTZ(3),
    "finishedAt" TIMESTAMPTZ(3),
    "cancelRequestedAt" TIMESTAMPTZ(3),
    "filtersSnapshot" JSONB NOT NULL,
    "searchUrl" TEXT,
    "maxPages" INTEGER NOT NULL,
    "selectorsVersion" TEXT,
    "pagesDone" INTEGER NOT NULL DEFAULT 0,
    "profilesDone" INTEGER NOT NULL DEFAULT 0,
    "leadsNew" INTEGER NOT NULL DEFAULT 0,
    "emailsFound" INTEGER NOT NULL DEFAULT 0,
    "haltReason" TEXT,
    "stats" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ScrapeRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilterRef" (
    "id" TEXT NOT NULL,
    "kind" "FilterRefKind" NOT NULL,
    "label" TEXT NOT NULL,
    "urn" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FilterRef_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInAccount_email_key" ON "LinkedInAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ScrapingPolicy_linkedInAccountId_key" ON "ScrapingPolicy"("linkedInAccountId");

-- CreateIndex
CREATE INDEX "AuditEvent_entity_entityId_at_idx" ON "AuditEvent"("entity", "entityId", "at");

-- CreateIndex
CREATE INDEX "AuditEvent_at_idx" ON "AuditEvent"("at");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Job_idempotencyKey_key" ON "Job"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Job_queue_status_priority_runAt_idx" ON "Job"("queue", "status", "priority", "runAt");

-- CreateIndex
CREATE INDEX "Job_status_leaseExpiresAt_idx" ON "Job"("status", "leaseExpiresAt");

-- CreateIndex
CREATE INDEX "Job_linkedInAccountId_status_idx" ON "Job"("linkedInAccountId", "status");

-- CreateIndex
CREATE INDEX "Job_runId_idx" ON "Job"("runId");

-- CreateIndex
CREATE INDEX "JobLog_jobId_at_idx" ON "JobLog"("jobId", "at");

-- CreateIndex
CREATE INDEX "RateBudget_windowEnd_idx" ON "RateBudget"("windowEnd");

-- CreateIndex
CREATE UNIQUE INDEX "RateBudget_scope_scopeId_metric_windowStart_key" ON "RateBudget"("scope", "scopeId", "metric", "windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_publicIdentifier_key" ON "Lead"("publicIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_memberUrn_key" ON "Lead"("memberUrn");

-- CreateIndex
CREATE INDEX "Lead_companyDomain_idx" ON "Lead"("companyDomain");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_createdAt_id_idx" ON "Lead"("createdAt", "id");

-- CreateIndex
CREATE INDEX "Lead_stage_createdAt_idx" ON "Lead"("stage", "createdAt");

-- CreateIndex
CREATE INDEX "LeadSnapshot_leadId_capturedAt_idx" ON "LeadSnapshot"("leadId", "capturedAt");

-- CreateIndex
CREATE INDEX "LeadSnapshot_runId_idx" ON "LeadSnapshot"("runId");

-- CreateIndex
CREATE INDEX "RunLead_leadId_idx" ON "RunLead"("leadId");

-- CreateIndex
CREATE INDEX "SearchDefinition_linkedInAccountId_idx" ON "SearchDefinition"("linkedInAccountId");

-- CreateIndex
CREATE INDEX "ScrapeRun_linkedInAccountId_status_idx" ON "ScrapeRun"("linkedInAccountId", "status");

-- CreateIndex
CREATE INDEX "ScrapeRun_searchDefinitionId_startedAt_idx" ON "ScrapeRun"("searchDefinitionId", "startedAt");

-- CreateIndex
CREATE INDEX "ScrapeRun_status_idx" ON "ScrapeRun"("status");

-- CreateIndex
CREATE INDEX "FilterRef_kind_label_idx" ON "FilterRef"("kind", "label");

-- CreateIndex
CREATE UNIQUE INDEX "FilterRef_kind_urn_key" ON "FilterRef"("kind", "urn");

-- AddForeignKey
ALTER TABLE "LinkedInAccount" ADD CONSTRAINT "LinkedInAccount_proxyId_fkey" FOREIGN KEY ("proxyId") REFERENCES "Proxy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapingPolicy" ADD CONSTRAINT "ScrapingPolicy_linkedInAccountId_fkey" FOREIGN KEY ("linkedInAccountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ScrapeRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_linkedInAccountId_fkey" FOREIGN KEY ("linkedInAccountId") REFERENCES "LinkedInAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobLog" ADD CONSTRAINT "JobLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_firstSeenRunId_fkey" FOREIGN KEY ("firstSeenRunId") REFERENCES "ScrapeRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadSnapshot" ADD CONSTRAINT "LeadSnapshot_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadSnapshot" ADD CONSTRAINT "LeadSnapshot_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ScrapeRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunLead" ADD CONSTRAINT "RunLead_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ScrapeRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunLead" ADD CONSTRAINT "RunLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchDefinition" ADD CONSTRAINT "SearchDefinition_linkedInAccountId_fkey" FOREIGN KEY ("linkedInAccountId") REFERENCES "LinkedInAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchDefinition" ADD CONSTRAINT "SearchDefinition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapeRun" ADD CONSTRAINT "ScrapeRun_searchDefinitionId_fkey" FOREIGN KEY ("searchDefinitionId") REFERENCES "SearchDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapeRun" ADD CONSTRAINT "ScrapeRun_linkedInAccountId_fkey" FOREIGN KEY ("linkedInAccountId") REFERENCES "LinkedInAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Hand-added CHECK constraints: Prisma's schema language has no declarative CHECK, so these are
-- appended here, before this migration is ever applied (not an edit of an already-applied
-- migration — see AGENTS.md's migration rule). Each guards a value whose correctness matters for
-- account safety, not just data hygiene.

-- Lead.emailConfidence is a 0-100 heuristic score; a buggy scorer must not be able to write 120.
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_emailConfidence_range"
  CHECK ("emailConfidence" IS NULL OR ("emailConfidence" >= 0 AND "emailConfidence" <= 100));

-- ScrapingPolicy min/max delay pairs must be ordered, or the pacer's randomized-delay call
-- (Math.random() between min and max) can produce a negative range and effectively zero delay —
-- silently disabling the anti-detection pacing the column exists to enforce.
ALTER TABLE "ScrapingPolicy" ADD CONSTRAINT "ScrapingPolicy_stepDelay_order"
  CHECK ("stepDelayMinMs" <= "stepDelayMaxMs");
ALTER TABLE "ScrapingPolicy" ADD CONSTRAINT "ScrapingPolicy_profileDelay_order"
  CHECK ("profileDelayMinMs" <= "profileDelayMaxMs");
ALTER TABLE "ScrapingPolicy" ADD CONSTRAINT "ScrapingPolicy_pageDelay_order"
  CHECK ("pageDelayMinMs" <= "pageDelayMaxMs");
ALTER TABLE "ScrapingPolicy" ADD CONSTRAINT "ScrapingPolicy_sessionBreak_order"
  CHECK ("sessionBreakMinMs" <= "sessionBreakMaxMs");
ALTER TABLE "ScrapingPolicy" ADD CONSTRAINT "ScrapingPolicy_activeHours_range"
  CHECK ("activeHoursStart" >= 0 AND "activeHoursStart" <= 23
     AND "activeHoursEnd" >= 0 AND "activeHoursEnd" <= 23);

-- Hard ceiling on daily profile views. ARCHITECTURE.md §9.4: "the instinct to raise them is
-- exactly what gets accounts restricted" — this makes that warning structural, not advisory.
-- 200/day is a generous upper bound; the application default (80) stays well under it.
ALTER TABLE "ScrapingPolicy" ADD CONSTRAINT "ScrapingPolicy_maxProfilesPerDay_ceiling"
  CHECK ("maxProfilesPerDay" > 0 AND "maxProfilesPerDay" <= 200);
