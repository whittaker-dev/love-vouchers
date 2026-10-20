import { createApp } from "./app.js";
import { runFirstBootSetup } from "./bootstrap.js";
import { config } from "./config.js";
import { prisma } from "./db.js";

// Creates the admin, profile and starter vouchers on a fresh database; a no-op afterwards.
await runFirstBootSetup();

const server = createApp().listen(config.PORT, () => {
  console.log(`API listening on http://localhost:${config.PORT}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
