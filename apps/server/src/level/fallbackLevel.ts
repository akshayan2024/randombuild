import type { LevelEnvelope } from "./levelSchema.js";

export function makeFallbackLevel(args: {
  levelType: LevelEnvelope["meta"]["levelType"];
  difficulty: LevelEnvelope["meta"]["difficulty"];
}): LevelEnvelope {
  return {
    meta: {
      id: `fallback_${args.levelType}_${args.difficulty}`,
      levelType: args.levelType,
      difficulty: args.difficulty,
      levelName: `Fallback ${args.levelType} (${args.difficulty})`,
    },
    allowedPieces: {
      blocks: ["Wall", "Wood", "Glass", "Roof"],
      furniture: [],
    },
    limits: { maxBlocks: 250, timeSec: 600 },
    spawn: { playerStart: { x: 0, y: 1, z: 0 } },
    rules: [
      {
        id: "r_roof",
        text: "Add a roof using Roof blocks (at least 10).",
        evaluate: { type: "roof_blocks_min", minRoofBlocks: 10 },
      },
      {
        id: "r_room",
        text: "Make at least 1 enclosed room (ground floor walls).",
        evaluate: { type: "enclosed_rooms_min", minRooms: 1 },
      },
      {
        id: "r_windows",
        text: "Add at least 4 windows (Glass blocks).",
        evaluate: { type: "window_glass_blocks_min", minWindows: 4 },
      },
      {
        id: "r_variety",
        text: "Use at least 3 different block types.",
        evaluate: { type: "block_variety_min", minVariety: 3 },
      },
      {
        id: "r_floaty",
        text: "Avoid floating blocks (no more than 5).",
        evaluate: { type: "floating_blocks_max", maxFloating: 5 },
      },
    ],
    scoring: [
      { ruleId: "r_room", points: 700, mode: "core" },
      { ruleId: "r_roof", points: 500, mode: "core" },
      { ruleId: "r_windows", points: 300, mode: "core" },
      { ruleId: "r_variety", points: 250, mode: "bonus" },
      { ruleId: "r_floaty", points: -200, mode: "penalty" },
    ],
  };
}
