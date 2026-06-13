import { create } from "zustand"

export type ActiveView = "canvas" | "text"

type ChromeState = {
  activeView: ActiveView
  setActiveView: (view: ActiveView) => void
  textCollapsed: Set<string>
  toggleTextCollapsed: (id: string) => void
  openContainers: string[]
  setOpenContainers: (ids: string[]) => void
  addContainer: (entityId: string) => void
  removeContainer: (entityId: string) => void
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
  openContainers: [],
  setOpenContainers: (ids) => set({ openContainers: ids }),
  addContainer: (entityId) => set((s) => ({
    openContainers: s.openContainers.includes(entityId) ? s.openContainers : [...s.openContainers, entityId],
  })),
  removeContainer: (entityId) => set((s) => ({
    openContainers: s.openContainers.filter((id) => id !== entityId),
  })),
}))
