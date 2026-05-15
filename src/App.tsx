import { useEffect, useRef } from "react"
import { useGraphStore } from "./store/useGraphStore"
import { getEntity } from "./engine/queries"
import ReadingViewport from "./renderers/ReadingViewport"
import { HomePage } from "@/components/HomePage"
import { AppSidebar } from "@/components/AppSidebar"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>
  }
}

function FolderPicker({ onOpen }: { onOpen: () => Promise<void> }) {
  const isSupported = typeof window.showDirectoryPicker === "function"

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md px-6">
          <p className="text-muted-foreground mb-2">
            Your browser does not support the File System Access API.
          </p>
          <p className="text-sm text-muted-foreground">
            Please use Chrome or Edge to open a project folder.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        className="px-6 py-3 rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm font-medium"
        onClick={onOpen}
      >
        Open a project folder
      </button>
    </div>
  )
}

function getViewParams(): { focused: string | null; anchor: string | null } {
  const params = new URLSearchParams(window.location.search)
  return {
    focused: params.get("focused"),
    anchor: params.get("anchor"),
  }
}

function updateUrl(focused: string | null, anchor: string | null) {
  const params = new URLSearchParams()
  if (focused) params.set("focused", focused)
  if (anchor) params.set("anchor", anchor)
  const search = params.toString()
  const url = search ? `${window.location.pathname}?${search}` : window.location.pathname
  history.replaceState(null, "", url)
}

function App() {
  const focusedEntityId = useGraphStore((s) => s.view.focusedEntityId)
  const anchorEntityId = useGraphStore((s) => s.view.anchorEntityId)
  const directoryHandle = useGraphStore((s) => s.directoryHandle)
  const openFolder = useGraphStore((s) => s.openFolder)
  const restoreFolder = useGraphStore((s) => s.restoreFolder)
  const focusEntity = useGraphStore((s) => s.focusEntity)

  const hasRestoredFromUrl = useRef(false)

  useEffect(() => {
    restoreFolder()
  }, [restoreFolder])

  useEffect(() => {
    if (!directoryHandle || hasRestoredFromUrl.current) return
    hasRestoredFromUrl.current = true

    const { focused, anchor } = getViewParams()
    if (focused) {
      const state = useGraphStore.getState()
      const entity = getEntity(state, focused)
      if (entity) {
        focusEntity(focused, anchor ?? focused)
      }
    }
  }, [directoryHandle, focusEntity])

  useEffect(() => {
    if (!directoryHandle) return

    const timer = setTimeout(() => {
      updateUrl(focusedEntityId, anchorEntityId)
    }, 200)

    return () => clearTimeout(timer)
  }, [focusedEntityId, anchorEntityId, directoryHandle])

  if (!directoryHandle) {
    return <FolderPicker onOpen={openFolder} />
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2 px-3 py-1.5 border-b shrink-0">
          <SidebarTrigger />
        </div>
        <div className="flex-1 min-h-0">
          {focusedEntityId ? <ReadingViewport /> : <HomePage />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
