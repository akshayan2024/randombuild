import type { Difficulty, LevelType, PlayerFeatures, SessionTelemetry } from "./types.js";
import { loadSessions, saveSessions } from "./storage.js";

const sessions: SessionTelemetry[] = loadSessions();

export function recordSession(input: Omit<SessionTelemetry, "completedAt">) {
  sessions.push({ ...input, completedAt: Date.now() });
  if (sessions.length > 5000) sessions.splice(0, sessions.length - 5000);
  saveSessions(sessions);
}
export function getSessions() { return sessions; }

export function extractFeatures(s: SessionTelemetry): PlayerFeatures {
  const scoreRatio = s.totalPossible > 0 ? s.score / s.totalPossible : 0;
  const speedScore = s.elapsedSec && s.elapsedSec > 0 ? Math.min(1, 600 / s.elapsedSec) : 0.5;
  const stabilityScore = Math.max(0, 1 - (s.floatingBlocks ?? 0) / 20);
  const buildComplexity = Math.min(1, (s.blocksPlaced ?? 0) / 300);
  return { scoreRatio, speedScore, stabilityScore, buildComplexity };
}

export function recommendNext(args: {
  levelType: LevelType;
  difficulty: Difficulty;
  score: number;
  totalPossible: number;
  blocksPlaced?: number;
  floatingBlocks?: number;
  elapsedSec?: number;
}) {
  const sample: SessionTelemetry = { ...args, completedAt: Date.now() };
  const f = extractFeatures(sample);
  const skill = 0.55 * f.scoreRatio + 0.15 * f.speedScore + 0.2 * f.stabilityScore + 0.1 * f.buildComplexity;

  let suggestedDifficulty: Difficulty = args.difficulty;
  if (skill >= 0.82) suggestedDifficulty = args.difficulty === "easy" ? "medium" : "hard";
  else if (skill < 0.45 && args.difficulty === "hard") suggestedDifficulty = "medium";
  else if (skill < 0.35 && args.difficulty === "medium") suggestedDifficulty = "easy";

  const preferredType = pickPreferredType(args.levelType, suggestedDifficulty);
  const message =
    skill >= 0.82
      ? "Amazing momentum. Ready for a tougher challenge!"
      : skill >= 0.55
      ? "Nice consistency. Keep practicing this level style."
      : "Good effort. One easier round can help lock in the basics.";

  return { suggestedDifficulty, suggestedLevelType: preferredType, message, features: f };
}

function pickPreferredType(current: LevelType, difficulty: Difficulty): LevelType {
  if (difficulty === "hard") return current === "random" ? "tower" : current;
  if (difficulty === "easy") return current === "bridge" ? "house" : current;
  return current;
}
