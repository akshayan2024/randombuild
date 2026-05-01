import { describe, expect, it } from "vitest";
import { validateOrThrow } from "./validator";

describe("validateOrThrow", () => {
  it("accepts a minimal valid envelope", () => {
    const level = validateOrThrow({
      meta: { id: "x", levelType: "house", difficulty: "easy", levelName: "X" },
      allowedPieces: { blocks: [], furniture: [] },
      limits: { maxBlocks: 250, timeSec: 600 },
      spawn: { playerStart: { x: 0, y: 1, z: 0 } },
      rules: [],
      scoring: [],
    });
    expect(level.meta.levelType).toBe("house");
  });
});

