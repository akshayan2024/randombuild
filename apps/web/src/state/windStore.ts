import { create } from "zustand";

type State = {
  windDirRad: number;
  windStrength: number;
  gustT: number;
  tickWind: (delta: number) => void;
};

export const useWindStore = create<State>((set, get) => ({
  windDirRad: Math.PI / 4,
  windStrength: 0.35,
  gustT: 0,
  tickWind: (delta) => {
    const s = get();
    const t = s.gustT + delta;
    set({
      gustT: t,
      windStrength: 0.25 + (Math.sin(t * 0.6) * 0.5 + 0.5) * 0.55,
      windDirRad: s.windDirRad + delta * 0.03,
    });
  },
}));
