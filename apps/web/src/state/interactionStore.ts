import { create } from "zustand";

type TvState = "on" | "off";
type OpenState = "open" | "closed";
type PowerState = "on" | "off";
type BedState = "awake" | "sleeping";
type ChairState = "standing" | "sitting";
type SinkState = "on" | "off";

type State = {
  tvByKey: Record<string, TvState>;
  doorByKey: Record<string, OpenState>;
  lampByKey: Record<string, PowerState>;
  stoveByKey: Record<string, PowerState>;
  bedByKey: Record<string, BedState>;
  chairByKey: Record<string, ChairState>;
  sinkByKey: Record<string, SinkState>;
  tableChairSnapHelpersVisible: boolean;
  toggleTv: (key: string) => void;
  toggleDoor: (key: string) => void;
  toggleLamp: (key: string) => void;
  toggleStove: (key: string) => void;
  toggleBedSleep: (key: string) => void;
  toggleChairSit: (key: string) => void;
  toggleSink: (key: string) => void;
  setTableChairSnapHelpersVisible: (visible: boolean) => void;
  clearInteractions: () => void;
};

export const useInteractionStore = create<State>((set) => ({
  tvByKey: {},
  doorByKey: {},
  lampByKey: {},
  stoveByKey: {},
  bedByKey: {},
  chairByKey: {},
  sinkByKey: {},
  tableChairSnapHelpersVisible: true,
  toggleTv: (key) =>
    set((s) => ({
      tvByKey: { ...s.tvByKey, [key]: s.tvByKey[key] === "on" ? "off" : "on" },
    })),
  toggleDoor: (key) =>
    set((s) => ({
      doorByKey: { ...s.doorByKey, [key]: s.doorByKey[key] === "open" ? "closed" : "open" },
    })),
  toggleLamp: (key) =>
    set((s) => ({
      lampByKey: { ...s.lampByKey, [key]: s.lampByKey[key] === "on" ? "off" : "on" },
    })),
  toggleStove: (key) =>
    set((s) => ({
      stoveByKey: { ...s.stoveByKey, [key]: s.stoveByKey[key] === "on" ? "off" : "on" },
    })),
  toggleBedSleep: (key) =>
    set((s) => ({
      bedByKey: { ...s.bedByKey, [key]: s.bedByKey[key] === "sleeping" ? "awake" : "sleeping" },
    })),
  toggleChairSit: (key) =>
    set((s) => ({
      chairByKey: { ...s.chairByKey, [key]: s.chairByKey[key] === "sitting" ? "standing" : "sitting" },
    })),
  toggleSink: (key) =>
    set((s) => ({
      sinkByKey: { ...s.sinkByKey, [key]: s.sinkByKey[key] === "on" ? "off" : "on" },
    })),
  setTableChairSnapHelpersVisible: (visible) => set({ tableChairSnapHelpersVisible: visible }),
  clearInteractions: () =>
    set({
      tvByKey: {},
      doorByKey: {},
      lampByKey: {},
      stoveByKey: {},
      bedByKey: {},
      chairByKey: {},
      sinkByKey: {},
      tableChairSnapHelpersVisible: true,
    }),
}));
