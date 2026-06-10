import { useEffect, useRef } from "react"
import { useGraphStore } from "../store/useGraphStore"
import { IndexedDBAdapter } from "@/store/persistence"
import GraphCanvas from "../canvas/GraphCanvas"

function WorkspaceRoot() {
  const init = useGraphStore((s) => s.init)

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

  return (
    <div className="w-full h-full">
      <GraphCanvas />
    </div>
  )
}

export default WorkspaceRoot
