import { create } from "zustand";
import type { BlockType } from "../game/blocks";
import type { GridPos } from "../game/grid";

export type FallingBlock = {
  id: string;
  type: BlockType;
  target: GridPos;
};

type State = {
  falling: FallingBlock[];
  enqueueFalling: (b: FallingBlock) => void;
  removeFalling: (id: string) => void;
  clearAll: () => void;
};

export const usePhysicsStore = create<State>((set) => ({
  falling: [],
  enqueueFalling: (b) => set((s) => ({ falling: [...s.falling, b] })),
  removeFalling: (id) => set((s) => ({ falling: s.falling.filter((f) => f.id !== id) })),
  clearAll: () => set({ falling: [] }),
}));

