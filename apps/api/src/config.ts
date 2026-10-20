import { existsSync } from "node:fs";
import { z } from "zod";

// Locally everything comes from the single .env at the repo root (same depth from src/ and dist/).
// On Render/Docker the variables are set in the environment, which loadEnvFile never overrides.
const ROOT_ENV_FILE = new URL("../../../.env", import.meta.url);
if (existsSync(ROOT_ENV_FILE)) process.loadEnvFile(ROOT_ENV_FILE);

const booleanString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  COOKIE_SECURE: booleanString,
  /** Built web app to serve from the API (production). Unset in dev, where Vite serves it. */
  WEB_DIST_DIR: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // Fail at boot with the exact missing variable instead of at the first request that needs it.
  console.error("Invalid environment configuration:\n" + z.prettifyError(parsed.error));
  process.exit(1);
}

export const config = parsed.data;
