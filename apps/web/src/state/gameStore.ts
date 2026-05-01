import { create } from "zustand";
import type { LevelEnvelope } from "../game/types";

type State = {
  level: LevelEnvelope | null;
  setLevel: (level: LevelEnvelope) => void;
  clearLevel: () => void;
};

export const useGameStore = create<State>((set) => ({
  level: null,
  setLevel: (level) => set({ level }),
  clearLevel: () => set({ level: null }),
}));
