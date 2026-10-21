import path from "node:path";
import cookieParser from "cookie-parser";
import express from "express";
import { config } from "./config.js";
import { errorHandler, notFound } from "./errors.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { herRouter } from "./routes/her.js";

export function createApp() {
  const app = express();

  // One proxy in front: the Vite dev server locally, Render's load balancer in production.
  // Needed so rate limiting keys on the real client IP rather than the proxy's.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api", herRouter);

  // Production: one service serves both the API and the built web app, so the browser sees a
  // single origin and the session cookie works without CORS, exactly like the Vite proxy in dev.
  if (config.WEB_DIST_DIR) {
    const webDist = path.resolve(config.WEB_DIST_DIR);
    // Vite fingerprints everything under /assets, so those files can be cached forever.
    app.use("/assets", express.static(path.join(webDist, "assets"), { immutable: true, maxAge: "1y" }));
    app.use(express.static(webDist, { index: false }));
    // Client-side routes (/em, /admin/...) get the SPA shell; unknown /api paths still 404 as JSON.
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
      res.set("Cache-Control", "no-cache");
      res.sendFile(path.join(webDist, "index.html"));
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
