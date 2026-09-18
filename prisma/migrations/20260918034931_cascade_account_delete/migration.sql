-- DropForeignKey
ALTER TABLE "ScrapeRun" DROP CONSTRAINT "ScrapeRun_linkedInAccountId_fkey";

-- DropForeignKey
ALTER TABLE "SearchDefinition" DROP CONSTRAINT "SearchDefinition_linkedInAccountId_fkey";

-- AddForeignKey
ALTER TABLE "SearchDefinition" ADD CONSTRAINT "SearchDefinition_linkedInAccountId_fkey" FOREIGN KEY ("linkedInAccountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapeRun" ADD CONSTRAINT "ScrapeRun_linkedInAccountId_fkey" FOREIGN KEY ("linkedInAccountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
