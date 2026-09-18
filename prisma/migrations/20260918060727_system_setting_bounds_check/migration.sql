-- Hand-edited (schema-change skill): defense-in-depth bounds on SystemSetting's operational
-- integers and JobArtifact.byteSize — a bad value here breaks the queue in a way a zod check
-- at the UI boundary can't catch once it's in the database (e.g. a raw `write_db`-style
-- update, or a future write path that forgets to validate). Same rationale as the existing
-- ScrapingPolicy delay-order and maxProfilesPerDay CHECKs in the init migration.

ALTER TABLE "SystemSetting"
  ADD CONSTRAINT "SystemSetting_workerConcurrency_range" CHECK ("workerConcurrency" BETWEEN 1 AND 32),
  ADD CONSTRAINT "SystemSetting_pollIntervalMs_positive" CHECK ("pollIntervalMs" >= 250),
  ADD CONSTRAINT "SystemSetting_leaseSeconds_positive" CHECK ("leaseSeconds" >= 30),
  ADD CONSTRAINT "SystemSetting_leaseHeartbeatMs_positive" CHECK ("leaseHeartbeatMs" >= 1000),
  ADD CONSTRAINT "SystemSetting_shutdownGraceMs_positive" CHECK ("shutdownGraceMs" >= 1000);

ALTER TABLE "JobArtifact"
  ADD CONSTRAINT "JobArtifact_byteSize_nonnegative" CHECK ("byteSize" >= 0);
