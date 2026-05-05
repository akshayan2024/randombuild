import { describe, expect, it } from "vitest";
import { extractFeatures, recommendNext } from "./recommender.js";

describe("recommender", () => {
  it("extracts bounded features", () => {
    const f = extractFeatures({
      levelType: "house",
      difficulty: "easy",
      score: 400,
      totalPossible: 800,
      blocksPlaced: 100,
      floatingBlocks: 2,
      elapsedSec: 200,
      completedAt: Date.now(),
    });
    expect(f.scoreRatio).toBeGreaterThanOrEqual(0);
    expect(f.scoreRatio).toBeLessThanOrEqual(1);
  });

  it("recommends higher difficulty for strong play", () => {
    const rec = recommendNext({
      levelType: "house",
      difficulty: "easy",
      score: 950,
      totalPossible: 1000,
      blocksPlaced: 240,
      floatingBlocks: 0,
      elapsedSec: 180,
    });
    expect(rec.suggestedDifficulty === "easy").toBe(false);
  });
});

