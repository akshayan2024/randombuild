import { Router } from "express";
import { deepseekGenerateJson } from "../ai/deepseekClient.js";
import { recordSession, recommendNext } from "../telemetry/recommender.js";
import type { Difficulty, LevelType } from "../telemetry/types.js";

export const hintRouter = Router();

hintRouter.post("/", async (req, res) => {
  const { levelType, difficulty, ruleProgress, blockCount, floatingCount, timeSec, elapsedSec } = req.body ?? {};
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return res.json({ hint: getStaticHint(ruleProgress, floatingCount) });

  const metRules = (ruleProgress ?? []).filter((r: { met: boolean }) => r.met).length;
  const totalRules = (ruleProgress ?? []).length;
  const timeLeft = (timeSec ?? 600) - (elapsedSec ?? 0);
  const unmetRules = (ruleProgress ?? [])
    .filter((r: { met: boolean }) => !r.met)
    .map((r: { text: string; detail: string }) => `- ${r.text} (${r.detail})`)
    .join("\n");
  const prompt = `You are a friendly building game coach for kids.
Level: ${levelType} (${difficulty}). Rules met: ${metRules}/${totalRules}. Time left: ${Math.round(timeLeft)}s. Blocks placed: ${blockCount}. Floating blocks: ${floatingCount}.
Unmet goals:\n${unmetRules || "(all goals met!)"}

Give a single encouraging 1-2 sentence hint that helps the player. Return only the hint text.`;

  try {
    const raw = await deepseekGenerateJson({ prompt, options: { apiKey } });
    const hint = typeof raw === "string" ? raw : (raw as { hint?: string }).hint ?? getStaticHint(ruleProgress, floatingCount);
    res.json({ hint });
  } catch {
    res.json({ hint: getStaticHint(ruleProgress, floatingCount) });
  }
});

hintRouter.post("/next-level", (req, res) => {
  const { levelType, difficulty, score, totalPossible, blocksPlaced, floatingBlocks, elapsedSec } = req.body ?? {};
  const lt: LevelType = levelType === "tower" || levelType === "bridge" || levelType === "random" ? levelType : "house";
  const df: Difficulty = difficulty === "medium" || difficulty === "hard" ? difficulty : "easy";
  const sc = Number(score ?? 0);
  const tp = Number(totalPossible ?? 0);
  const bp = Number(blocksPlaced ?? 0);
  const fb = Number(floatingBlocks ?? 0);
  const es = Number(elapsedSec ?? 0);

  const rec = recommendNext({
    levelType: lt,
    difficulty: df,
    score: sc,
    totalPossible: tp,
    blocksPlaced: bp,
    floatingBlocks: fb,
    elapsedSec: es,
  });
  recordSession({
    levelType: lt,
    difficulty: df,
    score: sc,
    totalPossible: tp,
    blocksPlaced: bp,
    floatingBlocks: fb,
    elapsedSec: es,
  });
  res.json(rec);
});

function getStaticHint(ruleProgress: { met: boolean; text: string }[] = [], floatingCount = 0): string {
  const unmet = ruleProgress.filter((r) => !r.met);
  if (floatingCount > 3) return "Watch out. Some blocks are floating. Add support blocks below.";
  if (unmet.length === 0) return "You met all goals. Hit Finish to see your score.";
  const first = unmet[0];
  if (first?.text) return `Focus next on: "${first.text}". Great progress so far.`;
  return "Keep building. Check the goals panel to see what's left.";
}

