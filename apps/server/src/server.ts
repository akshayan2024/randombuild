import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import express from "express";
import { levelRouter } from "./routes/level.js";
import { hintRouter } from "./routes/hint.js";
import { telemetryRouter } from "./routes/telemetry.js";

// Load .env from the repo root regardless of cwd or how the server is invoked.
config({ path: join(dirname(fileURLToPath(import.meta.url)), "../../../.env"), override: true });

export function createApp() {
  const app = express();
  // Fix 6: CORS — allow any origin so non-Vite-proxy consumers (staging, tests) aren't blocked
  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (_req.method === "OPTIONS") { res.sendStatus(204); return; }
    next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/level", levelRouter);
  app.use("/api/hint", hintRouter);
  app.use("/api/telemetry", telemetryRouter);
  return app;
}

function shouldAutoStart() {
  // Vitest sets VITEST; avoid binding ports during tests.
  if (process.env.VITEST) return false;
  // If this module is being imported (not executed), users can still call createApp().
  // Under tsx, import.meta.url comparisons can be unreliable, so we auto-start unless tests.
  return true;
}

if (shouldAutoStart()) {
  const app = createApp();
  const port = Number(process.env.PORT ?? 8002);
  app.listen(port, () => console.log(`server listening on ${port}`));
}
