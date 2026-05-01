export type BlockType = "Wall" | "Wood" | "Glass" | "Roof";

export const blockTypes: BlockType[] = ["Wall", "Wood", "Glass", "Roof"];

export function isBlockType(name: string): name is BlockType {
  return name === "Wall" || name === "Wood" || name === "Glass" || name === "Roof";
}

export function blockColor(type: BlockType): string {
  switch (type) {
    case "Wall":
      return "#8b5a3c";
    case "Wood":
      return "#b07a3a";
    case "Glass":
      return "#7dd3fc";
    case "Roof":
      return "#dc2626";
  }
}
