export const evaluatorTypes = [
  "min_height",
  "enclosed_rooms_min",
  "roof_blocks_min",
  "window_glass_blocks_min",
  "block_variety_min",
  "floating_blocks_max",
] as const;

export type EvaluatorType = (typeof evaluatorTypes)[number];

