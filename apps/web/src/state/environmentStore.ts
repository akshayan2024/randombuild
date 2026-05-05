import { create } from "zustand";

export const SEASONS = ["Spring", "Summer", "Autumn", "Winter"] as const;
export type Season = typeof SEASONS[number];

type EnvironmentState = {
  timeOfDay: number; // 0 to 24
  day: number;
  timeSpeed: number; // hours per real second
  advanceTime: (delta: number) => void;
};

export const useEnvironmentStore = create<EnvironmentState>((set) => ({
  timeOfDay: 10, // Start at 10 AM
  day: 1,
  timeSpeed: 0.02, // in-game hours per real second → 1 full day ≈ 20 real minutes
  advanceTime: (delta) => set((state) => {
    let newTime = state.timeOfDay + delta;
    let newDay = state.day;
    if (newTime >= 24) {
      newTime %= 24;
      newDay += 1;
    }
    return { timeOfDay: newTime, day: newDay };
  })
}));

export function getSeason(day: number): Season {
  // Change season every 7 days
  const sIndex = Math.floor((day - 1) / 7) % 4;
  return SEASONS[sIndex];
}
