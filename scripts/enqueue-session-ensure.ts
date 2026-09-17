import { env } from "@/server/config/env";
import { prisma } from "@/server/db/prisma";
import { findByEmail } from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import { enqueueJob } from "@/modules/jobs/service/queue.service";
import { hourBucketKey } from "@/modules/jobs/domain/idempotency";

/**
 * Deliberately separate from `db:seed` — seeding must stay idempotent/safe-to-rerun, while
 * enqueuing a real login is a risk-bearing action against the one scarce resource this whole
 * system protects (ARCHITECTURE.md §0). This script inserts exactly one `Job` row and exits;
 * it never imports playwright/scraper — the actual LinkedIn navigation happens later, in the
 * worker process, started deliberately by a human. That's why this doesn't violate CLAUDE.md
 * invariant #10 ("no script may hit linkedin.com").
 */
async function main() {
  if (!env.LINKEDIN_EMAIL) {
    console.error("LINKEDIN_EMAIL not set in .env — run `pnpm db:seed` first.");
    process.exitCode = 1;
    return;
  }

  const account = await findByEmail(env.LINKEDIN_EMAIL);
  if (!account) {
    console.error(`No LinkedInAccount found for ${env.LINKEDIN_EMAIL} — run \`pnpm db:seed\` first.`);
    process.exitCode = 1;
    return;
  }

  const job = await enqueueJob({
    type: "session.ensure",
    payload: { linkedInAccountId: account.id },
    linkedInAccountId: account.id,
    idempotencyKey: hourBucketKey("session-ensure", account.id),
  });

  if (!job) {
    console.log("A session.ensure job for this account is already queued this hour.");
    return;
  }
  console.log(`Enqueued session.ensure job ${job.id} for ${account.email}. Run \`pnpm worker\` to process it.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
