import { Router } from "express";
import { getSessions } from "../telemetry/recommender.js";
import { sessionsCsv } from "../telemetry/storage.js";

export const telemetryRouter = Router();

telemetryRouter.get("/export", (req, res) => {
  const format = req.query.format === "csv" ? "csv" : "json";
  const sessions = getSessions();
  if (format === "csv") {
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.send(sessionsCsv(sessions));
    return;
  }
  res.json({ count: sessions.length, sessions });
});

