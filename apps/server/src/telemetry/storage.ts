import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { SessionTelemetry } from "./types.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const dataPath = join(repoRoot, "logs", "telemetry", "sessions.json");

function ensureDir() {
  mkdirSync(dirname(dataPath), { recursive: true });
}

export function loadSessions(): SessionTelemetry[] {
  try {
    const raw = readFileSync(dataPath, "utf8");
    const parsed = JSON.parse(raw) as SessionTelemetry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: SessionTelemetry[]) {
  ensureDir();
  writeFileSync(dataPath, JSON.stringify(sessions, null, 2), "utf8");
}

export function sessionsCsv(sessions: SessionTelemetry[]) {
  const header = "completedAt,levelType,difficulty,score,totalPossible,blocksPlaced,floatingBlocks,elapsedSec";
  const rows = sessions.map((s) =>
    [s.completedAt, s.levelType, s.difficulty, s.score, s.totalPossible, s.blocksPlaced ?? 0, s.floatingBlocks ?? 0, s.elapsedSec ?? 0].join(","),
  );
  return [header, ...rows].join("\n");
}

