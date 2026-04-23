import { create } from "zustand";

const useRaiseHandWindowStore = create((set) => ({
  isEnabled: false,
  isWindowActive: false,
  timeRemaining: 0,
  hasRaisedHand: false,

  setHasRaisedHand: (val) => set({ hasRaisedHand: val }),

  setWindowState: (isEnabled, isWindowActive, timeRemaining) =>
    set({
      isEnabled,
      isWindowActive,
      timeRemaining,
    }),

  setTimeRemaining: (timeRemaining) =>
    set({
      timeRemaining: Math.max(0, timeRemaining),
    }),

  resetWindow: () =>
    set({
      isEnabled: false,
      isWindowActive: false,
      timeRemaining: 0,
      hasRaisedHand: false,
    }),
}));

export default useRaiseHandWindowStore;
