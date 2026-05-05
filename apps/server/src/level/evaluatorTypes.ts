export const evaluatorTypes = [
  "min_height",
  "enclosed_rooms_min",
  "roof_blocks_min",
  "window_glass_blocks_min",
  "block_variety_min",
  "floating_blocks_max",
  "door_present",
  "furniture_count_min",
  "kitchen_blocks_any2of3",
  "inside_house_min",
  "light_sources_min",
  "landscaping_blocks_min",
] as const;

export type EvaluatorType = (typeof evaluatorTypes)[number];

