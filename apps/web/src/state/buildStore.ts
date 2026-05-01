import { create } from "zustand";
import type { BlockType } from "../game/blocks";
import { keyOf, type GridPos } from "../game/grid";

type State = {
  selectedBlock: BlockType;
  blocks: Record<string, BlockType>;
  setSelectedBlock: (t: BlockType) => void;
  placeBlock: (pos: GridPos) => void;
  removeBlock: (pos: GridPos) => void;
  hasBlock: (pos: GridPos) => boolean;
  commitBlockAt: (pos: GridPos, type: BlockType) => void;
  resetBuild: () => void;
};

export const useBuildStore = create<State>((set, get) => ({
  selectedBlock: "Wall",
  blocks: {},
  setSelectedBlock: (t) => set({ selectedBlock: t }),
  placeBlock: (pos) => {
    const selected = get().selectedBlock;
    const key = keyOf(pos);
    set((s) => ({ blocks: { ...s.blocks, [key]: selected } }));
  },
  removeBlock: (pos) => {
    const key = keyOf(pos);
    set((s) => {
      if (!(key in s.blocks)) return s;
      const next = { ...s.blocks };
      delete next[key];
      return { blocks: next };
    });
  },
  hasBlock: (pos) => keyOf(pos) in get().blocks,
  commitBlockAt: (pos, type) => {
    const key = keyOf(pos);
    set((s) => ({ blocks: { ...s.blocks, [key]: type } }));
  },
  resetBuild: () => set({ blocks: {} }),
}));
