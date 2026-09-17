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

async function main() {
  await seedAdminUser();
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
