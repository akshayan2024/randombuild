import { Router } from "express";
import { generateLevel } from "../level/levelGenerator.js";

export const levelRouter = Router();

levelRouter.post("/generate", async (req, res) => {
  const { levelType, difficulty } = req.body ?? {};
  console.log("level.generate", { levelType, difficulty });

  const normalizedLevelType =
    levelType === "house" || levelType === "tower" || levelType === "bridge" || levelType === "random"
      ? levelType
      : "house";
  const normalizedDifficulty =
    difficulty === "easy" || difficulty === "medium" || difficulty === "hard" ? difficulty : "easy";

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const level = await generateLevel({
      levelType: normalizedLevelType,
      difficulty: normalizedDifficulty,
      apiKey,
    });
    res.json(level);
  } catch (err) {
    console.error("level.generate failed", err);
    res.status(500).json({
      error: "LEVEL_GENERATION_FAILED",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});
