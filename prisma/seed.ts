import { bootstrapAdminUserFromEnv } from "@/modules/user/service/bootstrapAdmin";
import { env } from "@/server/config/env";
import { prisma } from "@/server/db/prisma";

async function seedAdminUser() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.log(
      "ADMIN_EMAIL / ADMIN_PASSWORD not set in .env — skipping admin User bootstrap. " +
        "Fill them in and re-run `pnpm db:seed` when ready.",
    );
    return;
  }

  const result = await bootstrapAdminUserFromEnv({
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  });
  if (!result.ok) {
    console.error("Admin user bootstrap failed:", result.error.issues.join(", "));
    process.exitCode = 1;
    return;
  }

  const { id, email, created } = result.value;
  console.log(
    created
      ? `Bootstrapped admin User ${id} (${email}).`
      : `Admin User ${id} (${email}) already exists — left untouched.`,
  );
}

/**
 * Both are global singletons (`id: "global"`, enforced by a SQL CHECK — see
 * prisma/migrations/.../migration.sql). Empty `create`/`update` objects let every column's
 * own `@default(...)` fill in the values that used to live in `.env`
 * (ARCHITECTURE.md §10) — idempotent by design: a rerun never overwrites values an admin
 * has since tuned from /config, because `update: {}` touches nothing on an existing row.
 */
async function seedScrapingPolicy() {
  const existed = await prisma.scrapingPolicy.findUnique({ where: { id: "global" } });
  await prisma.scrapingPolicy.upsert({ where: { id: "global" }, create: {}, update: {} });
  console.log(existed ? "ScrapingPolicy already exists — left untouched." : "Seeded ScrapingPolicy.");
}

async function seedSystemSetting() {
  const existed = await prisma.systemSetting.findUnique({ where: { id: "global" } });
  await prisma.systemSetting.upsert({ where: { id: "global" }, create: {}, update: {} });
  console.log(existed ? "SystemSetting already exists — left untouched." : "Seeded SystemSetting.");
}

async function main() {
  await seedAdminUser();
  await seedScrapingPolicy();
  await seedSystemSetting();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
