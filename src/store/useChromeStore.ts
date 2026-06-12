import { create } from "zustand"

export type ActiveView = "canvas" | "text"

type ChromeState = {
  activeView: ActiveView
  setActiveView: (view: ActiveView) => void
  textCollapsed: Set<string>
  toggleTextCollapsed: (id: string) => void
}

export const useChromeStore = create<ChromeState>((set, get) => ({
  activeView: "canvas",
  setActiveView: (view) => set({ activeView: view }),
  textCollapsed: new Set(),
  toggleTextCollapsed: (id) => {
    const next = new Set(get().textCollapsed)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    set({ textCollapsed: next })
  },
}))
