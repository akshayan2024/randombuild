export function buildLevelPrompt(args: {
  levelType: "house" | "tower" | "bridge" | "random";
  difficulty: "easy" | "medium" | "hard";
}) {
  const id = `${args.levelType}_${args.difficulty}_${Date.now()}`;
  return `Return STRICT JSON only. No markdown, no code fences, no commentary. Match this structure EXACTLY:

{
  "meta": {
    "id": "${id}",
    "levelType": "${args.levelType}",
    "difficulty": "${args.difficulty}",
    "levelName": "A Fun House"
  },
  "allowedPieces": {
    "blocks": ["Wall", "Wood", "Glass", "Roof"],
    "furniture": []
  },
  "limits": {
    "maxBlocks": 200,
    "timeSec": 600
  },
  "spawn": {
    "playerStart": { "x": 0, "y": 0, "z": 0 }
  },
  "rules": [
    {
      "id": "r_roof",
      "text": "Add at least 10 roof blocks.",
      "evaluate": { "type": "roof_blocks_min", "minRoofBlocks": 10 }
    },
    {
      "id": "r_room",
      "text": "Make at least 1 enclosed room.",
      "evaluate": { "type": "enclosed_rooms_min", "minRooms": 1 }
    }
  ],
  "scoring": [
    { "ruleId": "r_roof", "points": 500, "mode": "core" },
    { "ruleId": "r_room", "points": 700, "mode": "core" }
  ]
}

Supported evaluator types — use EXACT parameter names shown:
  roof_blocks_min       → { "type": "roof_blocks_min", "minRoofBlocks": N }
  enclosed_rooms_min    → { "type": "enclosed_rooms_min", "minRooms": N }
  window_glass_blocks_min → { "type": "window_glass_blocks_min", "minWindows": N }
  block_variety_min     → { "type": "block_variety_min", "minVariety": N }
  floating_blocks_max   → { "type": "floating_blocks_max", "maxFloating": N }
  min_height            → { "type": "min_height", "minHeight": N }

Available block names: Wall, Wood, Glass, Roof
Rules: use 3-6 rules; scoring points per rule 100-800; difficulty=${args.difficulty} levelType=${args.levelType}
Generate a fun, kid-friendly level. Replace example values with your own creative choices.`;
}
