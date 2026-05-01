import express from "express";
import { levelRouter } from "./routes/level.js";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/level", levelRouter);
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
