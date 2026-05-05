import { MeshStandardMaterial, SRGBColorSpace, TextureLoader, RepeatWrapping } from "three";
import { BLOCK_META, type BlockType } from "../game/blocks";
import type { Season } from "../state/environmentStore";

const loader = new TextureLoader();
const textureCache = new Map<string, ReturnType<TextureLoader["load"]>>();

function loadTextureCached(url: string) {
  if (!textureCache.has(url)) {
    const t = loader.load(url);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    textureCache.set(url, t);
  }
  return textureCache.get(url)!;
}

export type BlockMaterialOptions = {
  season?: Season;
  state?: string;
  onSwitch?: (info: { type: BlockType; state?: string; textureUrl?: string }) => void;
};

function normalizeBlockState(type: BlockType, state?: string): string | undefined {
  if (!state) return undefined;
  const s = state.toLowerCase();
  if (type === "Wall") {
    if (s === "damaged1" || s === "damage1" || s === "lightdamage") return "damageLight";
    if (s === "damaged2" || s === "damage2" || s === "mediumdamage") return "damageMedium";
    if (s === "damaged3" || s === "damage3" || s === "heavydamage") return "damageHeavy";
    if (s === "cracked") return "damageCracked";
    if (s === "destroyed" || s === "broken") return "damageDestroyed";
  }
  if (type === "Wood") {
    if (s === "aged1" || s === "aging1") return "agedLight";
    if (s === "aged2" || s === "aging2") return "agedMedium";
    if (s === "aged3" || s === "aging3") return "agedHeavy";
    if (s === "rot1" || s === "rotten1") return "rotLight";
    if (s === "rot2" || s === "rotten2") return "rotMedium";
    if (s === "rot3" || s === "rotten3") return "rotHeavy";
  }
  if (type === "Glass") {
    if (s === "cooltint" || s === "tintblue") return "tintCool";
    if (s === "warmtint" || s === "tintgreen") return "tintWarm";
    if (s === "smoketint" || s === "tintgray" || s === "tintgrey") return "tintSmoke";
    if (s === "breakline" || s === "fracture") return "breakLine";
    if (s === "breakshatter" || s === "shatter") return "breakShatter";
    if (s === "breakimpact" || s === "impact") return "breakImpact";
  }
  return state;
}

export function makeBlockMaterial(type: BlockType, emissiveBoost = 1, options?: Season | BlockMaterialOptions) {
  const meta = BLOCK_META[type];
  const resolvedOptions: BlockMaterialOptions =
    typeof options === "string" || options === undefined ? { season: options } : options;
  const { season, state, onSwitch } = resolvedOptions;
  const resolvedState = normalizeBlockState(type, state);
  const stateTextureUrl = resolvedState ? meta.stateTextureUrl?.[resolvedState] : undefined;
  const stateColor = resolvedState ? meta.stateColor?.[resolvedState] : undefined;
  const stateOpacity = resolvedState ? meta.stateOpacity?.[resolvedState] : undefined;
  const stateTransparent = resolvedState ? meta.stateTransparent?.[resolvedState] : undefined;
  const stateEmissive = resolvedState ? meta.stateEmissive?.[resolvedState] : undefined;
  const stateEmissiveIntensity = resolvedState ? meta.stateEmissiveIntensity?.[resolvedState] : undefined;
  const isWater = type === "Water";
  const material = new MeshStandardMaterial({
    color: stateColor ?? meta.color,
    roughness: isWater ? 0.28 : 0.85,
    metalness: isWater ? 0.06 : 0,
    transparent: isWater ? true : stateTransparent ?? !!meta.transparent,
    opacity: stateOpacity ?? meta.opacity ?? 1,
    emissive: stateEmissive ?? meta.emissive ?? "#000",
    emissiveIntensity: (stateEmissiveIntensity ?? meta.emissiveIntensity ?? 0) * emissiveBoost,
  });
  const seasonal = season ? meta.seasonalTextureUrl?.[season] : undefined;
  const textureUrl = stateTextureUrl ?? seasonal ?? meta.textureUrl;
  if (textureUrl) {
    material.map = loadTextureCached(textureUrl);
  }
  if (onSwitch) onSwitch({ type, state: resolvedState ?? state, textureUrl });
  return material;
}
