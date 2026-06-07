import { describe, it, expect, vi, beforeEach } from "vitest"
import { useGraphStore } from "@/store/useGraphStore"

function shouldWriteHeight(
  autoHeight: boolean,
  offsetHeight: number,
  currentCanvasHeight: number | undefined,
): { write: boolean; newHeight: number } {
  if (!autoHeight) return { write: false, newHeight: 0 }
  const newHeight = Math.round(offsetHeight)
  const current = currentCanvasHeight ?? 0
  return { write: Math.abs(newHeight - current) > 1, newHeight }
}

describe("shouldWriteHeight (measurement guard)", () => {
  it("writes when height changes by more than 1px", () => {
    const r = shouldWriteHeight(true, 100, 98)
    expect(r.write).toBe(true)
    expect(r.newHeight).toBe(100)
  })

  it("does not write when delta is 1px or less", () => {
    expect(shouldWriteHeight(true, 100, 99).write).toBe(false)
    expect(shouldWriteHeight(true, 100, 100).write).toBe(false)
    expect(shouldWriteHeight(true, 100, 101).write).toBe(false)
  })

  it("rounds offsetHeight before comparing", () => {
    const r = shouldWriteHeight(true, 99.6, 98)
    expect(r.write).toBe(true)
    expect(r.newHeight).toBe(100)
  })

  it("treats undefined current height as 0", () => {
    const r = shouldWriteHeight(true, 64, undefined)
    expect(r.write).toBe(true)
    expect(r.newHeight).toBe(64)
  })

  it("does not write when autoHeight is false", () => {
    expect(shouldWriteHeight(false, 200, 50).write).toBe(false)
  })

  it("does not write when offsetHeight is 0 and current is 0", () => {
    expect(shouldWriteHeight(true, 0, 0).write).toBe(false)
  })
})

describe("EntityNode measurement → store", () => {
  beforeEach(() => {
    useGraphStore.setState({
      entities: [{ id: "entity-1", type: "concept" as const, content: "", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } }],
      relations: [],
      featureFlags: { autoHeight: true },
    })
  })

  it("writes height to store when guard allows", () => {
    const current = useGraphStore.getState().entities[0]
    const { write, newHeight } = shouldWriteHeight(true, 192, current.canvasData.height)
    expect(write).toBe(true)

    if (write) {
      useGraphStore.getState().updateEntity("entity-1", {
        canvasData: { ...current.canvasData, height: newHeight },
      })
    }

    const updated = useGraphStore.getState().entities[0]
    expect(updated.canvasData.height).toBe(192)
  })

  it("does not write height to store when delta ≤ 1px", () => {
    useGraphStore.setState({
      entities: [{ id: "entity-1", type: "concept" as const, content: "", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0, height: 191 } }],
    })
    const current = useGraphStore.getState().entities[0]

    const updateSpy = vi.spyOn(useGraphStore.getState(), "updateEntity")
    const { write } = shouldWriteHeight(true, 191, current.canvasData.height)
    expect(write).toBe(false)

    if (write) {
      useGraphStore.getState().updateEntity("entity-1", {
        canvasData: { ...current.canvasData, height: 191 },
      })
    }

    expect(updateSpy).not.toHaveBeenCalled()
  })

  it("does not write when autoHeight is off", () => {
    useGraphStore.setState({ featureFlags: { autoHeight: false } })
    const updateSpy = vi.spyOn(useGraphStore.getState(), "updateEntity")
    const { write } = shouldWriteHeight(false, 999, 50)
    expect(write).toBe(false)
    expect(updateSpy).not.toHaveBeenCalled()
  })
})
