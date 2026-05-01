import type { BlockType } from "../blocks";

export type BuildSnapshot = {
  blocks: Record<string, BlockType>;
};

export type Rule = {
  id: string;
  text: string;
  evaluate: { type: string } & Record<string, unknown>;
};

export type ScoringItem = {
  ruleId: string;
  points: number;
  mode: "core" | "bonus" | "penalty";
};

export type RuleResult = {
  ruleId: string;
  met: boolean;
  detail: string;
};

export type ScoreLine = {
  ruleId: string;
  text: string;
  met: boolean;
  pointsAwarded: number;
  mode: ScoringItem["mode"];
  detail: string;
};

export type ScoreSummary = {
  total: number;
  lines: ScoreLine[];
};

