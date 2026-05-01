import { parseKey } from "../grid";
import type { BlockType } from "../blocks";
import type { BuildSnapshot, Rule, RuleResult, ScoreLine, ScoreSummary, ScoringItem } from "./types";

export function evaluateRule(build: BuildSnapshot, rule: Rule): RuleResult {
  switch (rule.evaluate.type) {
    case "roof_blocks_min": {
      const minRoofBlocks = asInt(rule.evaluate.minRoofBlocks, 0);
      const roofCount = countType(build.blocks, "Roof");
      const met = roofCount >= minRoofBlocks;
      return {
        ruleId: rule.id,
        met,
        detail: `${roofCount}/${minRoofBlocks} roof blocks`,
      };
    }
    case "block_variety_min": {
      const minVariety = asInt(rule.evaluate.minVariety, 0);
      const variety = new Set(Object.values(build.blocks)).size;
      const met = variety >= minVariety;
      return {
        ruleId: rule.id,
        met,
        detail: `${variety}/${minVariety} block types used`,
      };
    }
    case "floating_blocks_max": {
      const maxFloating = asInt(rule.evaluate.maxFloating, 0);
      const floating = countFloatingBlocks(build.blocks);
      const met = floating <= maxFloating;
      return {
        ruleId: rule.id,
        met,
        detail: `${floating} floating blocks (max ${maxFloating})`,
      };
    }
    case "window_glass_blocks_min": {
      const minWindows = asInt(rule.evaluate.minWindows, 0);
      const glassCount = countType(build.blocks, "Glass");
      const met = glassCount >= minWindows;
      return {
        ruleId: rule.id,
        met,
        detail: `${glassCount}/${minWindows} glass blocks`,
      };
    }
    case "enclosed_rooms_min": {
      const minRooms = asInt(rule.evaluate.minRooms, 0);
      const rooms = countEnclosedRooms2D(build.blocks);
      const met = rooms >= minRooms;
      return {
        ruleId: rule.id,
        met,
        detail: `${rooms}/${minRooms} rooms`,
      };
    }
    case "min_height": {
      const minHeight = asInt(rule.evaluate.minHeight, 1);
      const maxY = Object.keys(build.blocks).reduce((m, key) => {
        const { y } = parseKey(key);
        return Math.max(m, y + 1);
      }, 0);
      const met = maxY >= minHeight;
      return { ruleId: rule.id, met, detail: `${maxY}/${minHeight} height` };
    }
    default:
      return { ruleId: rule.id, met: false, detail: `Unknown rule type: ${rule.evaluate.type}` };
  }
}

export function scoreBuild(args: {
  build: BuildSnapshot;
  rules: Rule[];
  scoring: ScoringItem[];
}): ScoreSummary {
  const results = new Map<string, RuleResult>();
  for (const rule of args.rules) results.set(rule.id, evaluateRule(args.build, rule));

  const ruleText = new Map(args.rules.map((r) => [r.id, r.text]));

  const lines: ScoreLine[] = args.scoring.map((s) => {
    const r = results.get(s.ruleId) ?? { ruleId: s.ruleId, met: false, detail: "Missing rule" };
    const text = ruleText.get(s.ruleId) ?? s.ruleId;
    // penalty mode: subtract points when condition is NOT met (too many bad things)
    const adjusted = s.mode === "penalty" ? (r.met ? 0 : s.points) : r.met ? s.points : 0;

    return {
      ruleId: s.ruleId,
      text,
      met: r.met,
      pointsAwarded: adjusted,
      mode: s.mode,
      detail: r.detail,
    };
  });

  const total = Math.max(
    0,
    lines.reduce((acc, l) => acc + l.pointsAwarded, 0),
  );

  return { total, lines };
}

function asInt(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function countType(blocks: Record<string, BlockType>, t: BlockType): number {
  let c = 0;
  for (const v of Object.values(blocks)) if (v === t) c++;
  return c;
}

function countFloatingBlocks(blocks: Record<string, BlockType>): number {
  let floating = 0;
  for (const key of Object.keys(blocks)) {
    const { x, y, z } = parseKey(key);
    if (y <= 0) continue;
    const belowKey = `${x},${y - 1},${z}`;
    if (!(belowKey in blocks)) floating++;
  }
  return floating;
}

function countEnclosedRooms2D(blocks: Record<string, BlockType>): number {
  // MVP room detector: 2D flood-fill on ground plane (y=0).
  // Walls are any blocks at y=0. Ground itself counts as floor.
  const wall = new Set<string>();
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const key of Object.keys(blocks)) {
    const { x, y, z } = parseKey(key);
    if (y !== 0) continue;
    wall.add(`${x},${z}`);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }

  if (wall.size === 0) return 0;

  // Expand bounds by 2 so outside flood has space.
  minX -= 2;
  maxX += 2;
  minZ -= 2;
  maxZ += 2;

  const w = maxX - minX + 1;
  const h = maxZ - minZ + 1;

  const idx = (x: number, z: number) => (z - minZ) * w + (x - minX);
  const inBounds = (x: number, z: number) => x >= minX && x <= maxX && z >= minZ && z <= maxZ;

  const outside = new Uint8Array(w * h);
  const qx: number[] = [];
  const qz: number[] = [];

  const push = (x: number, z: number) => {
    const i = idx(x, z);
    if (outside[i]) return;
    if (wall.has(`${x},${z}`)) return;
    outside[i] = 1;
    qx.push(x);
    qz.push(z);
  };

  // Flood-fill outside from boundary.
  for (let x = minX; x <= maxX; x++) {
    push(x, minZ);
    push(x, maxZ);
  }
  for (let z = minZ; z <= maxZ; z++) {
    push(minX, z);
    push(maxX, z);
  }

  while (qx.length) {
    const x = qx.pop()!;
    const z = qz.pop()!;
    const n = [
      [x + 1, z],
      [x - 1, z],
      [x, z + 1],
      [x, z - 1],
    ];
    for (const [nx, nz] of n) {
      if (!inBounds(nx, nz)) continue;
      push(nx, nz);
    }
  }

  // Any non-wall cell not marked outside belongs to an enclosed room region.
  const visited = new Uint8Array(w * h);
  let rooms = 0;

  const bfs = (sx: number, sz: number) => {
    const stackX = [sx];
    const stackZ = [sz];
    visited[idx(sx, sz)] = 1;
    while (stackX.length) {
      const x = stackX.pop()!;
      const z = stackZ.pop()!;
      const n = [
        [x + 1, z],
        [x - 1, z],
        [x, z + 1],
        [x, z - 1],
      ];
      for (const [nx, nz] of n) {
        if (!inBounds(nx, nz)) continue;
        const i = idx(nx, nz);
        if (visited[i]) continue;
        if (outside[i]) continue;
        if (wall.has(`${nx},${nz}`)) continue;
        visited[i] = 1;
        stackX.push(nx);
        stackZ.push(nz);
      }
    }
  };

  for (let z = minZ; z <= maxZ; z++) {
    for (let x = minX; x <= maxX; x++) {
      const i = idx(x, z);
      if (visited[i]) continue;
      if (outside[i]) continue;
      if (wall.has(`${x},${z}`)) continue;
      rooms++;
      bfs(x, z);
    }
  }

  return rooms;
}
