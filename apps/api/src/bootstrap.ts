import { hashPassword } from "./auth.js";
import { prisma } from "./db.js";
import { Prisma } from "./generated/prisma/client.js";
import { STARTER_OCCASIONS, STARTER_PROFILE, starterVoucherRows } from "./starterData.js";

// First-boot setup, run every time the API starts (index.ts) and by `pnpm db:seed`:
// admin (from env), settings, her profile, starter vouchers and occasions. Her login is created
// by the admin in the admin pages.
// Each step does its work at most once per database, so restarts, redeploys and several
// instances booting together never duplicate anything or undo the admin's edits.

/** Creates the admin from ADMIN_* env vars, but only while no admin exists yet. */
async function ensureAdmin(): Promise<void> {
  if (await prisma.admin.count()) return;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("No admin account yet: set ADMIN_EMAIL and ADMIN_PASSWORD, then restart to create it.");
    return;
  }
  const name = process.env.ADMIN_NAME?.trim() || "Anh";
  try {
    await prisma.admin.create({ data: { email, name, passwordHash: await hashPassword(password) } });
    console.log(`✔ Admin created: ${email}`);
  } catch (error) {
    // Another instance booting at the same moment created it first (unique email).
    if (!isUniqueViolation(error)) throw error;
  }
}

/** The single settings row (monthly wish limit). */
async function ensureSettings(): Promise<void> {
  try {
    await prisma.appSetting.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }
}

/** The single profile row; never overwritten once it exists. */
async function ensureProfile(): Promise<void> {
  try {
    await prisma.profile.upsert({ where: { id: 1 }, create: { id: 1, ...STARTER_PROFILE }, update: {} });
  } catch (error) {
    // Two instances booting together can both try the insert; the loser just finds it exists.
    if (!isUniqueViolation(error)) throw error;
  }
}

/**
 * The starter vouchers, created exactly once per database. The SetupStep marker is inserted in
 * the same transaction: whoever inserts it first seeds, everyone else hits the primary key and
 * skips, and deleting every voucher later does not bring them back.
 */
async function ensureStarterVouchers(): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.setupStep.create({ data: { key: "starter-vouchers" } });
      const { count } = await tx.voucher.createMany({ data: starterVoucherRows() });
      console.log(`✔ ${count} starter vouchers created`);
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }
}

/** Default occasions, created exactly once per database (same marker pattern as the vouchers). */
async function ensureStarterOccasions(): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.setupStep.create({ data: { key: "starter-occasions" } });
      const { count } = await tx.occasion.createMany({ data: STARTER_OCCASIONS });
      console.log(`✔ ${count} starter occasions created`);
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function runFirstBootSetup(): Promise<void> {
  await ensureAdmin();
  await ensureSettings();
  await ensureProfile();
  await ensureStarterVouchers();
  await ensureStarterOccasions();
}
