import { useEffect, useRef } from "react"
import { useGraphStore } from "../store/useGraphStore"
import { resolveAdapter } from "@/store/persistence"
import GraphCanvas from "../canvas/GraphCanvas"

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
    <div className="w-full h-full">
      <GraphCanvas />
    </div>
  )
}

export default WorkspaceRoot
