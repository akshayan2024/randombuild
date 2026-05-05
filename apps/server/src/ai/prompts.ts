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
    "levelName": "A descriptive level name"
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

=== AVAILABLE BLOCK NAMES ===
Structural:  Wall, Wood, Glass, Roof, Door
Kitchen:     Sink, Stove, Counter
Furniture:   Bed, Table, Chair, Lamp, Plant, TV
Landscaping: Grass, Dirt, Leaves, Water, Sand
Lights:      Torch, Lantern
Variants:    Stairs, Fence

=== SUPPORTED EVALUATOR TYPES (use EXACT parameter names) ===
  roof_blocks_min           → { "type": "roof_blocks_min", "minRoofBlocks": N }
  enclosed_rooms_min        → { "type": "enclosed_rooms_min", "minRooms": N }
  window_glass_blocks_min   → { "type": "window_glass_blocks_min", "minWindows": N }
  block_variety_min         → { "type": "block_variety_min", "minVariety": N }
  floating_blocks_max       → { "type": "floating_blocks_max", "maxFloating": N }
  min_height                → { "type": "min_height", "minHeight": N }
  door_present              → { "type": "door_present" }
  furniture_count_min       → { "type": "furniture_count_min", "minFurniture": N }
  kitchen_blocks_any2of3    → { "type": "kitchen_blocks_any2of3" }
  inside_house_min          → { "type": "inside_house_min", "minItems": N }
  light_sources_min         → { "type": "light_sources_min", "minLights": N }
  landscaping_blocks_min    → { "type": "landscaping_blocks_min", "minLandscaping": N }

=== RULES ===
- difficulty=${args.difficulty}, levelType=${args.levelType}
- Use 3-6 rules total; mix "core", "bonus", and "penalty" modes in scoring
- Points per rule: 100–800 for core/bonus; penalties use negative values or "penalty" mode
- allowedPieces.blocks must only contain block names from the list above, relevant to the level type
- For house levels: use Wall, Roof, Glass, Door, furniture if hard
- For tower levels: focus on height, variety, Fence, Stairs, Lantern
- For bridge levels: focus on min_height, floating_blocks_max, Fence, Stairs
- For random levels: use creative mix of all categories
- Replace ALL example values with your own creative choices
- Generate a fun, imaginative, kid-friendly level name`;
}
