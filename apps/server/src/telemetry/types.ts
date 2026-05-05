export type LevelType = "house" | "tower" | "bridge" | "random";
export type Difficulty = "easy" | "medium" | "hard";

export type SessionTelemetry = {
  levelType: LevelType;
  difficulty: Difficulty;
  score: number;
  totalPossible: number;
  blocksPlaced?: number;
  floatingBlocks?: number;
  elapsedSec?: number;
  completedAt: number;
};

export type PlayerFeatures = {
  scoreRatio: number;
  speedScore: number;
  stabilityScore: number;
  buildComplexity: number;
};
