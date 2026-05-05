import { create } from "zustand";

type TimerState = {
  secondsLeft: number;
  running: boolean;
  expired: boolean;
  start: (totalSeconds: number) => void;
  tick: (delta: number) => void;
  stop: () => void;
  reset: () => void;
};

export const useTimerStore = create<TimerState>((set, get) => ({
  secondsLeft: 0,
  running: false,
  expired: false,
  start: (totalSeconds) => set({ secondsLeft: totalSeconds, running: true, expired: false }),
  tick: (delta) => {
    const { running, secondsLeft } = get();
    if (!running) return;
    const next = secondsLeft - delta;
    if (next <= 0) {
      set({ secondsLeft: 0, running: false, expired: true });
    } else {
      set({ secondsLeft: next });
    }
  },
  stop: () => set({ running: false }),
  reset: () => set({ secondsLeft: 0, running: false, expired: false }),
}));
