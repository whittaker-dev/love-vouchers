import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

// Prisma 7 does not load .env on its own. Locally it lives at the repo root; on Render/Docker the
// variables come from the environment (loadEnvFile never overrides them), so the file is optional.
const ROOT_ENV_FILE = new URL("../../.env", import.meta.url);
if (existsSync(ROOT_ENV_FILE)) process.loadEnvFile(ROOT_ENV_FILE);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
