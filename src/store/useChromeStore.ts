import { create } from "zustand"

export type ActiveView = "canvas" | "text"

type ChromeState = {
  activeView: ActiveView
  setActiveView: (view: ActiveView) => void
}

export const useChromeStore = create<ChromeState>((set) => ({
  activeView: "canvas",
  setActiveView: (view) => set({ activeView: view }),
}))
