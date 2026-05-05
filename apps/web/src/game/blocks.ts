// ─── Core structural ───────────────────────────────────────────────────────
// ─── Furniture / interior ─────────────────────────────────────────────────
// ─── Landscaping ──────────────────────────────────────────────────────────
// ─── Light sources ────────────────────────────────────────────────────────
// ─── Structural variants ─────────────────────────────────────────────────

export type BlockType =
  // Core structural
  | "Wall" | "Wood" | "Glass" | "Roof" | "Door"
  // Kitchen
  | "Sink" | "Stove" | "Counter"
  // Furniture
  | "Bed" | "Table" | "Chair" | "Lamp" | "Plant" | "TV"
  // Landscaping
  | "Grass" | "Dirt" | "Leaves" | "Water" | "Sand"
  // Light sources
  | "Torch" | "Lantern"
  // Structural variants
  | "Stairs" | "Fence";

export type BlockCategory = "Structural" | "Kitchen" | "Furniture" | "Landscaping" | "Lights" | "Variants";

export type BlockMeta = {
  color: string;
  textureUrl?: string;
  seasonalTextureUrl?: Partial<Record<"Spring" | "Summer" | "Autumn" | "Winter", string>>;
  stateTextureUrl?: Record<string, string>;
  stateColor?: Record<string, string>;
  stateOpacity?: Record<string, number>;
  stateTransparent?: Record<string, boolean>;
  stateEmissive?: Record<string, string>;
  stateEmissiveIntensity?: Record<string, number>;
  modelUrl?: string;
  emissive?: string;      // Three.js emissive color for light-emitting blocks
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  pointLight?: boolean;   // Whether this block emits a Three.js PointLight
  category: BlockCategory;
  shape?: "cube" | "tv";
  modelTransform?: {
    scale: [number, number, number];
    position: [number, number, number];
    rotation: [number, number, number];
  };
};

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  // Structural
  Wall:    {
    color: "#8b5a3c",
    textureUrl: "/textures/wall/albedo.jpg",
    stateTextureUrl: {
      paintReady: "/textures/wall/paint-ready.jpg",
      decalReady: "/textures/wall/decal-ready.jpg",
      damageLight: "/textures/wall/damage-light.jpg",
      damageMedium: "/textures/wall/damage-medium.jpg",
      damageHeavy: "/textures/wall/damage-heavy.jpg",
      damageCracked: "/textures/wall/damage-heavy.jpg",
      damageDestroyed: "/textures/wall/damage-heavy.jpg",
    },
    stateColor: {
      damageLight: "#82604a",
      damageMedium: "#745845",
      damageHeavy: "#5f4b3e",
      damageCracked: "#5f4b3e",
      damageDestroyed: "#514237",
    },
    category: "Structural",
  },
  Wood:    {
    color: "#b07a3a",
    textureUrl: "/textures/wood/albedo.jpg",
    stateTextureUrl: {
      aged: "/textures/wood/aged.jpg",
      rot: "/textures/wood/rot.jpg",
      agedLight: "/textures/wood/aged.jpg",
      agedMedium: "/textures/wood/aged.jpg",
      agedHeavy: "/textures/wood/aged.jpg",
      rotLight: "/textures/wood/rot.jpg",
      rotMedium: "/textures/wood/rot.jpg",
      rotHeavy: "/textures/wood/rot.jpg",
    },
    stateColor: {
      aged: "#9b6c3c",
      rot: "#6c5b45",
      agedLight: "#a87844",
      agedMedium: "#94673a",
      agedHeavy: "#7f5a34",
      rotLight: "#76644f",
      rotMedium: "#675643",
      rotHeavy: "#594835",
    },
    category: "Structural",
  },
  Glass:   {
    color: "#7dd3fc",
    textureUrl: "/textures/glass/albedo.jpg",
    stateTextureUrl: {
      tint: "/textures/glass/tint.jpg",
      breakReady: "/textures/glass/break-ready.jpg",
      tintCool: "/textures/glass/tint.jpg",
      tintWarm: "/textures/glass/tint.jpg",
      tintSmoke: "/textures/glass/tint.jpg",
      breakLine: "/textures/glass/break-ready.jpg",
      breakShatter: "/textures/glass/break-ready.jpg",
      breakImpact: "/textures/glass/break-ready.jpg",
    },
    stateColor: {
      tint: "#5fb7e6",
      breakReady: "#b7d5e6",
      tintCool: "#63c4ff",
      tintWarm: "#7fc2d6",
      tintSmoke: "#92a9ba",
      breakLine: "#bdd7e6",
      breakShatter: "#b5cfde",
      breakImpact: "#a8c4d4",
    },
    stateOpacity: {
      tint: 0.5,
      breakReady: 0.35,
      tintCool: 0.48,
      tintWarm: 0.45,
      tintSmoke: 0.4,
      breakLine: 0.32,
      breakShatter: 0.26,
      breakImpact: 0.22,
    },
    stateTransparent: {
      tint: true,
      breakReady: true,
      tintCool: true,
      tintWarm: true,
      tintSmoke: true,
      breakLine: true,
      breakShatter: true,
      breakImpact: true,
    },
    category: "Structural",
    transparent: true,
    opacity: 0.45,
  },
  Roof:    { color: "#dc2626", textureUrl: "/textures/roof/albedo.jpg", category: "Structural" },
  Door:    { color: "#5c4033", textureUrl: "/textures/door/albedo.jpg", modelUrl: "/models/door.glb", modelTransform: { scale: [0.5, 0.5, 0.5], position: [0, -0.5, 0], rotation: [0, 0, 0] }, category: "Structural" },
  // Kitchen
  Sink:    { color: "#e0e0e0", category: "Kitchen" },
  Stove:   { color: "#424242", modelUrl: "/models/stove.glb", modelTransform: { scale: [0.48, 0.48, 0.48], position: [0, -0.5, 0], rotation: [0, 0, 0] }, category: "Kitchen" },
  Counter: { color: "#d7ccc8", category: "Kitchen" },
  // Furniture
  Bed:     { color: "#ef5350", category: "Furniture" },
  Table:   { color: "#8d6e63", category: "Furniture" },
  Chair:   { color: "#795548", category: "Furniture" },
  Lamp:    { color: "#ffeb3b", emissive: "#ffe082", emissiveIntensity: 0.5, modelUrl: "/models/lamp.glb", modelTransform: { scale: [0.5, 0.5, 0.5], position: [0, -0.5, 0], rotation: [0, 0, 0] }, category: "Furniture" },
  Plant:   { color: "#4caf50", category: "Furniture" },
  TV:      { color: "#212121", textureUrl: "/textures/tv/albedo.jpg", emissive: "#448aff", emissiveIntensity: 0.3, modelUrl: "/models/tv.glb", modelTransform: { scale: [0.5, 0.5, 0.5], position: [0, -0.5, 0], rotation: [0, 0, 0] }, category: "Furniture", shape: "tv" },
  // Landscaping
  Grass:   { color: "#66bb6a", textureUrl: "/textures/grass/albedo.jpg", seasonalTextureUrl: { Autumn: "/textures/grass/autumn.jpg", Winter: "/textures/grass/winter.jpg" }, category: "Landscaping" },
  Dirt:    { color: "#795548", category: "Landscaping" },
  Leaves:  { color: "#388e3c", textureUrl: "/textures/leaves/albedo.jpg", seasonalTextureUrl: { Autumn: "/textures/leaves/autumn.jpg", Winter: "/textures/leaves/winter.jpg" }, transparent: true, opacity: 0.85, category: "Landscaping" },
  Water:   { color: "#29b6f6", textureUrl: "/textures/water/albedo.jpg", seasonalTextureUrl: { Winter: "/textures/water/winter.jpg" }, transparent: true, opacity: 0.6, category: "Landscaping" },
  Sand:    { color: "#ffe082", category: "Landscaping" },
  // Light sources
  Torch:   { color: "#ff7043", emissive: "#ff5722", emissiveIntensity: 1.2, pointLight: true, category: "Lights" },
  Lantern: { color: "#ffd54f", emissive: "#ffb300", emissiveIntensity: 0.9, pointLight: true, category: "Lights" },
  // Structural variants
  Stairs:  { color: "#a1887f", category: "Variants" },
  Fence:   { color: "#bcaaa4", category: "Variants" },
};

export const blockTypes = Object.keys(BLOCK_META) as BlockType[];

export function isBlockType(name: string): name is BlockType {
  return name in BLOCK_META;
}

export function blockColor(type: BlockType): string {
  return BLOCK_META[type]?.color ?? "#888";
}

export function blockMeta(type: BlockType): BlockMeta {
  return BLOCK_META[type];
}

/** Blocks grouped by category, in palette display order */
export const BLOCK_CATEGORIES: BlockCategory[] = [
  "Structural", "Kitchen", "Furniture", "Landscaping", "Lights", "Variants",
];

export function blocksByCategory(category: BlockCategory): BlockType[] {
  return blockTypes.filter((t) => BLOCK_META[t].category === category);
}
