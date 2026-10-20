import { hashPassword } from "../src/auth.js";
import { runFirstBootSetup } from "../src/bootstrap.js";
import { prisma } from "../src/db.js";

// `pnpm db:seed`: makes the single admin match ADMIN_* in .env (updated in place, never
// duplicated: also the way to reset a forgotten password), then runs the same one-time setup
// the API does on boot (profile and starter vouchers, each created at most once per database).

async function syncAdminFromEnv() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Anh";
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env (repo root) before seeding");
  }

  const passwordHash = await hashPassword(password);
  const existing = await prisma.admin.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) {
    await prisma.admin.update({ where: { id: existing.id }, data: { email, name, passwordHash } });
    // Older seeds upserted by email and could leave a second admin behind.
    await prisma.admin.deleteMany({ where: { id: { not: existing.id } } });
    console.log(`✔ Admin updated: ${email} (${name})`);
  }
  // No admin yet: runFirstBootSetup creates it from the same env vars.
}

syncAdminFromEnv()
  .then(runFirstBootSetup)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
