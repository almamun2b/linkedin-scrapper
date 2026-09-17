import { env } from "@/server/config/env";
import { prisma } from "@/server/db/prisma";
import { bootstrapAccountFromEnv } from "@/modules/linkedin-account/service/bootstrapAccount";
import { bootstrapAdminUserFromEnv } from "@/modules/user/service/bootstrapAdmin";

async function seedLinkedInAccount() {
  if (!env.LINKEDIN_EMAIL || !env.LINKEDIN_PASSWORD) {
    console.log(
      "LINKEDIN_EMAIL / LINKEDIN_PASSWORD not set in .env — skipping LinkedInAccount bootstrap. " +
        "Fill them in and re-run `pnpm db:seed` when ready.",
    );
    return;
  }

  const result = await bootstrapAccountFromEnv({
    email: env.LINKEDIN_EMAIL,
    password: env.LINKEDIN_PASSWORD,
    label: "primary",
  });

  if (!result.ok) {
    console.error("LinkedInAccount bootstrap failed:", result.error.issues.join(", "));
    process.exitCode = 1;
    return;
  }

  const { id, email, status, created } = result.value;
  console.log(
    created
      ? `Bootstrapped LinkedInAccount ${id} (${email}), status=${status}.`
      : `LinkedInAccount ${id} (${email}) already exists, status=${status} — left untouched.`,
  );
}

async function seedAdminUser() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.log(
      "ADMIN_EMAIL / ADMIN_PASSWORD not set in .env — skipping admin User bootstrap. " +
        "Fill them in and re-run `pnpm db:seed` when ready.",
    );
    return;
  }

  const result = await bootstrapAdminUserFromEnv({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });
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
  await seedLinkedInAccount();
  await seedAdminUser();
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
