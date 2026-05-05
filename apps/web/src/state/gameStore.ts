import { create } from "zustand";
import type { LevelEnvelope } from "../game/types";

export type GameMode = "challenge" | "creative";

type State = {
  level: LevelEnvelope | null;
  gameMode: GameMode;
  setLevel: (level: LevelEnvelope) => void;
  setGameMode: (mode: GameMode) => void;
  clearLevel: () => void;
};

export const useGameStore = create<State>((set) => ({
  level: null,
  gameMode: "challenge",
  setLevel: (level) => set({ level }),
  setGameMode: (gameMode) => set({ gameMode }),
  clearLevel: () => set({ level: null }),
}));
