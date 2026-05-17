import { useEffect, useRef } from "react"
import { useGraphStore } from "../store/useGraphStore"
import { AppSidebar } from "@/components/AppSidebar"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { resolveAdapter } from "@/store/persistence"

function WorkspaceRoot() {
  const init = useGraphStore((s) => s.init)

  const hasInitialized = useRef(false)

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    resolveAdapter().then((adapter) => {
      init(adapter)
    })
  }, [init])

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2 px-3 py-1.5 border-b shrink-0">
          <SidebarTrigger />
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <h1 className="text-2xl text-muted-foreground">Workspace</h1>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default WorkspaceRoot
