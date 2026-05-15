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
import { resolveAdapter } from "@/store/persistence"

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
  const focusEntity = useGraphStore((s) => s.focusEntity)
  const init = useGraphStore((s) => s.init)

  const hasInitialized = useRef(false)
  const hasRestoredFromUrl = useRef(false)

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    resolveAdapter().then((adapter) => {
      init(adapter)
    })
  }, [init])

  useEffect(() => {
    if (hasRestoredFromUrl.current) return
    hasRestoredFromUrl.current = true

    const { focused, anchor } = getViewParams()
    if (focused) {
      const state = useGraphStore.getState()
      const entity = getEntity(state, focused)
      if (entity) {
        focusEntity(focused, anchor ?? focused)
      }
    }
  }, [focusEntity])

  useEffect(() => {
    const timer = setTimeout(() => {
      updateUrl(focusedEntityId, anchorEntityId)
    }, 200)

    return () => clearTimeout(timer)
  }, [focusedEntityId, anchorEntityId])

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
