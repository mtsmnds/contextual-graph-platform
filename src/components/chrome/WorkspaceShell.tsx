import { useEffect, useRef, useCallback } from "react"
import { useGraphStore } from "../../store/useGraphStore"
import { useChromeStore } from "../../store/useChromeStore"
import { IndexedDBAdapter, FSAdapter, FSError } from "@/store/persistence"
import type { GraphSnapshot } from "../../types/graph"
import type { LayoutOptions } from "../../engine/layout"
import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "../../canvas/panels/AppSidebar"
import GraphCanvas from "../../canvas/GraphCanvas"
import TextView from "./TextView"

function WorkspaceShell() {
  const init = useGraphStore((s) => s.init)
  const activeView = useChromeStore((s) => s.activeView)

  const hasInitialized = useRef(false)

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    const adapter = new IndexedDBAdapter()
    init(adapter)
  }, [init])

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (useGraphStore.getState().isDirty()) {
        event.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  const layoutRef = useRef<((opts: LayoutOptions) => void) | null>(null)
  const onRunLayout = useCallback((opts: LayoutOptions) => layoutRef.current?.(opts), [])

  const onOpenFolder = useCallback(async () => {
    const fsAdapter = new FSAdapter()
    try {
      const snapshot = await fsAdapter.open()
      if (snapshot) {
        const store = useGraphStore.getState()
        store.setFsAdapter(fsAdapter)
        store.openFromDisk(snapshot, fsAdapter.getFolderName()!)
      } else if (fsAdapter.isOpen()) {
        const name = fsAdapter.getFolderName()!
        const confirmed = window.confirm(`This folder is empty. Create a new workspace in ${name}?`)
        if (confirmed) {
          const store = useGraphStore.getState()
          const emptySnapshot: GraphSnapshot = {
            version: 5,
            entities: store.entities,
            relations: store.relations,
            canvas: store.canvas,
          }
          await fsAdapter.save(emptySnapshot)
          store.setFsAdapter(fsAdapter)
          store.openFromDisk(emptySnapshot, name)
        } else {
          fsAdapter.close()
        }
      }
    } catch (err) {
      if (err instanceof FSError) {
        if (err.code === "PERMISSION_DENIED") {
          window.alert(`Cannot access folder — ${err.detail}`)
        } else {
          window.alert(`Cannot open — ${err.detail} (code: ${err.code})`)
        }
      } else {
        console.error("Unexpected error opening folder:", err)
      }
    }
  }, [])

  return (
    <SidebarProvider>
      <div className="w-full h-full flex">
        {activeView === "canvas" ? (
          <GraphCanvas layoutRef={layoutRef} />
        ) : (
          <TextView />
        )}
      </div>
      <AppSidebar onOpenFolder={onOpenFolder} onRunLayout={onRunLayout} />
    </SidebarProvider>
  )
}

export default WorkspaceShell
