import { describe, expect, it, vi } from "vitest";
import { fetchLevel } from "./levelClient";

describe("fetchLevel", () => {
  it("parses a level envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          meta: { id: "x", levelType: "house", difficulty: "easy", levelName: "X" },
          allowedPieces: { blocks: [], furniture: [] },
          limits: { maxBlocks: 250, timeSec: 600 },
          spawn: { playerStart: { x: 0, y: 1, z: 0 } },
          rules: [],
          scoring: [],
        }),
        text: async () => "",
      })) as any,
    );

    const level = await fetchLevel({ levelType: "house", difficulty: "easy" });
    expect(level.meta.id).toBe("x");
  });
});
