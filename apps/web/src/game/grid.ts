export type GridPos = { x: number; y: number; z: number };

export function keyOf(pos: GridPos): string {
  return `${pos.x},${pos.y},${pos.z}`;
}

export function parseKey(key: string): GridPos {
  const [x, y, z] = key.split(",").map((n) => Number(n));
  return { x, y, z };
}

