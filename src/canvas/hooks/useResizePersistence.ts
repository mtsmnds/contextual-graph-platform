import { useCallback } from "react"
import { useGraphStore } from "@/store/useGraphStore"

const GRID = 16

export function useResizePersistence(entityId: string) {
  return useCallback(
    (_: unknown, params: { x: number; y: number; width: number; height: number }) => {
      const store = useGraphStore.getState()
      store.beginBatch("Resize node")
      store.updateEntity(entityId, {
        canvasData: {
          x: Math.ceil(params.x / GRID) * GRID,
          y: Math.ceil(params.y / GRID) * GRID,
          width: Math.ceil(params.width / GRID) * GRID,
          height: Math.ceil(params.height / GRID) * GRID,
        },
      })
      store.endBatch()
    },
    [entityId],
  )
}
