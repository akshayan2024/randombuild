import { deepseekGenerateJson } from "../ai/deepseekClient.js";
import { buildLevelPrompt } from "../ai/prompts.js";
import { makeFallbackLevel } from "./fallbackLevel.js";
import { validateOrThrow } from "./validator.js";
import type { LevelEnvelope } from "./levelSchema.js";

export async function generateLevel(args: {
  levelType: LevelEnvelope["meta"]["levelType"];
  difficulty: LevelEnvelope["meta"]["difficulty"];
  apiKey?: string;
}): Promise<LevelEnvelope> {
  if (!args.apiKey) return makeFallbackLevel(args);

  const prompt = buildLevelPrompt({
    levelType: args.levelType,
    difficulty: args.difficulty,
  });

  // Attempt 1
  try {
    const raw = await deepseekGenerateJson({ prompt, options: { apiKey: args.apiKey } });
    return validateOrThrow(raw);
  } catch (e1) {
    console.warn("Level generation attempt 1 failed:", e1 instanceof Error ? e1.message : e1);
    // Attempt 2 (stricter)
    const strictPrompt = `${prompt}\n\nCRITICAL: Return ONLY the raw JSON object. No markdown, no backticks, no explanation.`;
    try {
      const raw = await deepseekGenerateJson({ prompt: strictPrompt, options: { apiKey: args.apiKey } });
      return validateOrThrow(raw);
    } catch (e2) {
      console.warn("Level generation attempt 2 failed:", e2 instanceof Error ? e2.message : e2);
      return makeFallbackLevel(args);
    }
  }
}
