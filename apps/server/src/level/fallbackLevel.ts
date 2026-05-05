import type { LevelEnvelope } from "./levelSchema.js";

export function makeFallbackLevel(args: {
  levelType: LevelEnvelope["meta"]["levelType"];
  difficulty: LevelEnvelope["meta"]["difficulty"];
}): LevelEnvelope {
  const { levelType, difficulty } = args;
  const id = `fallback_${levelType}_${difficulty}`;

  // ── House ──────────────────────────────────────────────────────────────────
  if (levelType === "house") {
    if (difficulty === "easy") {
      return {
        meta: { id, levelType, difficulty, levelName: "The Little Starter Cottage" },
        allowedPieces: { blocks: ["Wall", "Wood", "Glass", "Roof", "Door"], furniture: [] },
        limits: { maxBlocks: 200, timeSec: 600 },
        spawn: { playerStart: { x: 0, y: 0, z: 0 } },
        rules: [
          { id: "r_room",  text: "Build at least 1 enclosed room.",        evaluate: { type: "enclosed_rooms_min",      minRooms: 1 } },
          { id: "r_roof",  text: "Add at least 8 Roof blocks.",            evaluate: { type: "roof_blocks_min",         minRoofBlocks: 8 } },
          { id: "r_door",  text: "Add a Door to the house.",               evaluate: { type: "door_present" } },
          { id: "r_float", text: "Keep floating blocks to 3 or fewer.",    evaluate: { type: "floating_blocks_max",     maxFloating: 3 } },
        ],
        scoring: [
          { ruleId: "r_room",  points: 600, mode: "core" },
          { ruleId: "r_roof",  points: 400, mode: "core" },
          { ruleId: "r_door",  points: 200, mode: "bonus" },
          { ruleId: "r_float", points: 150, mode: "penalty" },
        ],
      };
    }
    if (difficulty === "medium") {
      return {
        meta: { id, levelType, difficulty, levelName: "The Glass-Window Family Home" },
        allowedPieces: { blocks: ["Wall", "Wood", "Glass", "Roof", "Door", "Fence"], furniture: ["Bed", "Table", "Chair", "Lamp", "Plant"] },
        limits: { maxBlocks: 300, timeSec: 720 },
        spawn: { playerStart: { x: 0, y: 0, z: 0 } },
        rules: [
          { id: "r_room",    text: "Build at least 1 enclosed room.",        evaluate: { type: "enclosed_rooms_min",        minRooms: 1 } },
          { id: "r_roof",    text: "Add at least 12 Roof blocks.",           evaluate: { type: "roof_blocks_min",           minRoofBlocks: 12 } },
          { id: "r_windows", text: "Add at least 4 Glass windows.",          evaluate: { type: "window_glass_blocks_min",   minWindows: 4 } },
          { id: "r_door",    text: "Add a Door to the house.",               evaluate: { type: "door_present" } },
          { id: "r_furni",   text: "Place at least 2 furniture items.",      evaluate: { type: "furniture_count_min",       minFurniture: 2 } },
          { id: "r_float",   text: "Keep floating blocks to 3 or fewer.",    evaluate: { type: "floating_blocks_max",       maxFloating: 3 } },
        ],
        scoring: [
          { ruleId: "r_room",    points: 600, mode: "core" },
          { ruleId: "r_roof",    points: 400, mode: "core" },
          { ruleId: "r_windows", points: 300, mode: "core" },
          { ruleId: "r_door",    points: 200, mode: "bonus" },
          { ruleId: "r_furni",   points: 250, mode: "bonus" },
          { ruleId: "r_float",   points: 150, mode: "penalty" },
        ],
      };
    }
    // hard
    return {
      meta: { id, levelType, difficulty, levelName: "The Grand Dream Mansion" },
      allowedPieces: { blocks: ["Wall", "Wood", "Glass", "Roof", "Door", "Stairs", "Fence", "Torch", "Lantern"], furniture: ["Bed", "Table", "Chair", "Lamp", "Plant", "TV", "Sink", "Stove", "Counter"] },
      limits: { maxBlocks: 500, timeSec: 900 },
      spawn: { playerStart: { x: 0, y: 0, z: 0 } },
      rules: [
        { id: "r_rooms",   text: "Build at least 2 enclosed rooms.",        evaluate: { type: "enclosed_rooms_min",      minRooms: 2 } },
        { id: "r_roof",    text: "Add at least 20 Roof blocks.",            evaluate: { type: "roof_blocks_min",         minRoofBlocks: 20 } },
        { id: "r_windows", text: "Add at least 6 Glass windows.",           evaluate: { type: "window_glass_blocks_min", minWindows: 6 } },
        { id: "r_kitchen", text: "Build a kitchen (2 of: Sink, Stove, Counter).", evaluate: { type: "kitchen_blocks_any2of3" } },
        { id: "r_furni",   text: "Place at least 4 furniture items inside.", evaluate: { type: "inside_house_min",        minItems: 4 } },
        { id: "r_lights",  text: "Add at least 2 light sources.",           evaluate: { type: "light_sources_min",       minLights: 2 } },
        { id: "r_height",  text: "Build at least 4 blocks tall.",           evaluate: { type: "min_height",              minHeight: 4 } },
        { id: "r_float",   text: "Keep floating blocks to 2 or fewer.",     evaluate: { type: "floating_blocks_max",     maxFloating: 2 } },
      ],
      scoring: [
        { ruleId: "r_rooms",   points: 700, mode: "core" },
        { ruleId: "r_roof",    points: 400, mode: "core" },
        { ruleId: "r_windows", points: 300, mode: "core" },
        { ruleId: "r_kitchen", points: 500, mode: "core" },
        { ruleId: "r_furni",   points: 450, mode: "core" },
        { ruleId: "r_lights",  points: 200, mode: "bonus" },
        { ruleId: "r_height",  points: 200, mode: "bonus" },
        { ruleId: "r_float",   points: 200, mode: "penalty" },
      ],
    };
  }

  // ── Tower ──────────────────────────────────────────────────────────────────
  if (levelType === "tower") {
    const minH = difficulty === "easy" ? 6 : difficulty === "medium" ? 10 : 16;
    const minLights = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 4;
    const maxBlocks = difficulty === "easy" ? 150 : difficulty === "medium" ? 250 : 400;
    const names = ["The Lookout Spire", "The Storm Watchtower", "The Sky Fortress"];
    const name = names[["easy", "medium", "hard"].indexOf(difficulty)];
    return {
      meta: { id, levelType, difficulty, levelName: name },
      allowedPieces: { blocks: ["Wall", "Wood", "Glass", "Roof", "Stairs", "Fence", "Torch", "Lantern"], furniture: [] },
      limits: { maxBlocks, timeSec: 600 },
      spawn: { playerStart: { x: 0, y: 0, z: 0 } },
      rules: [
        { id: "r_height",  text: `Build at least ${minH} blocks tall.`,    evaluate: { type: "min_height",          minHeight: minH } },
        { id: "r_variety", text: "Use at least 3 different block types.",   evaluate: { type: "block_variety_min",   minVariety: 3 } },
        { id: "r_lights",  text: `Add at least ${minLights} light source${minLights > 1 ? "s" : ""}.`, evaluate: { type: "light_sources_min", minLights } },
        { id: "r_float",   text: "Keep floating blocks to 4 or fewer.",     evaluate: { type: "floating_blocks_max", maxFloating: 4 } },
      ],
      scoring: [
        { ruleId: "r_height",  points: 700, mode: "core" },
        { ruleId: "r_variety", points: 300, mode: "bonus" },
        { ruleId: "r_lights",  points: 250, mode: "bonus" },
        { ruleId: "r_float",   points: 200, mode: "penalty" },
      ],
    };
  }

  // ── Bridge ─────────────────────────────────────────────────────────────────
  if (levelType === "bridge") {
    const minH = difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 7;
    const maxFloat = difficulty === "easy" ? 6 : difficulty === "medium" ? 3 : 1;
    const maxBlocks = difficulty === "easy" ? 150 : difficulty === "medium" ? 200 : 300;
    const names = ["The Wooden Crossing", "The River Arch Bridge", "The Grand Suspension Span"];
    const name = names[["easy", "medium", "hard"].indexOf(difficulty)];
    return {
      meta: { id, levelType, difficulty, levelName: name },
      allowedPieces: { blocks: ["Wall", "Wood", "Fence", "Stairs", "Glass", "Lantern"], furniture: [] },
      limits: { maxBlocks, timeSec: 600 },
      spawn: { playerStart: { x: 0, y: 0, z: 0 } },
      rules: [
        { id: "r_height",  text: `Build at least ${minH} blocks above ground.`, evaluate: { type: "min_height",          minHeight: minH } },
        { id: "r_float",   text: `Keep floating/unsupported blocks to ${maxFloat} or fewer.`, evaluate: { type: "floating_blocks_max", maxFloating: maxFloat } },
        { id: "r_variety", text: "Use at least 2 different block types.",           evaluate: { type: "block_variety_min",   minVariety: 2 } },
      ],
      scoring: [
        { ruleId: "r_height",  points: 600, mode: "core" },
        { ruleId: "r_float",   points: 400, mode: "penalty" },
        { ruleId: "r_variety", points: 200, mode: "bonus" },
      ],
    };
  }

  // ── Random ─────────────────────────────────────────────────────────────────
  return {
    meta: { id, levelType: "random", difficulty, levelName: "The Wild Mystery Build" },
    allowedPieces: {
      blocks: ["Wall", "Wood", "Glass", "Roof", "Door", "Grass", "Dirt", "Leaves", "Plant", "Torch", "Lantern", "Fence", "Stairs"],
      furniture: ["Bed", "Table", "Chair", "Plant", "Lamp"],
    },
    limits: { maxBlocks: 300, timeSec: 720 },
    spawn: { playerStart: { x: 0, y: 0, z: 0 } },
    rules: [
      { id: "r_room",    text: "Build at least 1 enclosed room.",      evaluate: { type: "enclosed_rooms_min",    minRooms: 1 } },
      { id: "r_variety", text: "Use at least 4 different block types.", evaluate: { type: "block_variety_min",    minVariety: 4 } },
      { id: "r_land",    text: "Place at least 5 landscaping blocks.", evaluate: { type: "landscaping_blocks_min", minLandscaping: 5 } },
      { id: "r_lights",  text: "Add at least 1 light source.",         evaluate: { type: "light_sources_min",    minLights: 1 } },
      { id: "r_float",   text: "Keep floating blocks to 5 or fewer.",  evaluate: { type: "floating_blocks_max",  maxFloating: 5 } },
    ],
    scoring: [
      { ruleId: "r_room",    points: 600, mode: "core" },
      { ruleId: "r_variety", points: 350, mode: "core" },
      { ruleId: "r_land",    points: 300, mode: "bonus" },
      { ruleId: "r_lights",  points: 200, mode: "bonus" },
      { ruleId: "r_float",   points: 200, mode: "penalty" },
    ],
  };
}

