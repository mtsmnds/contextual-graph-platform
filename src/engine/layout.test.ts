import { describe, it, expect, vi } from "vitest"
import { stackChildren } from "./layout"

const PADDING = { top: 32, right: 16, bottom: 16, left: 16 }
const GAP = 16

describe("stackChildren", () => {
  it("stacks children in sortOrder", () => {
    const result = stackChildren(
      [
        { id: "a", width: 368, height: 80, sortOrder: "a0" },
        { id: "b", width: 368, height: 100, sortOrder: "a1" },
        { id: "c", width: 368, height: 120, sortOrder: "a2" },
      ],
      GAP,
      PADDING,
    )
    expect(result.children).toHaveLength(3)
    expect(result.children[0]).toEqual({ id: "a", x: 16, y: 32 })
    expect(result.children[1]).toEqual({ id: "b", x: 16, y: 128 })
    expect(result.children[2]).toEqual({ id: "c", x: 16, y: 244 })
  })

  it("computes container width from widest child", () => {
    const result = stackChildren(
      [
        { id: "a", width: 300, height: 80, sortOrder: "a0" },
        { id: "b", width: 500, height: 80, sortOrder: "a1" },
        { id: "c", width: 200, height: 80, sortOrder: "a2" },
      ],
      GAP,
      PADDING,
    )
    expect(result.containerWidth).toBe(532)
  })

  it("computes container height from stacked children", () => {
    const result = stackChildren(
      [
        { id: "a", width: 368, height: 80, sortOrder: "a0" },
        { id: "b", width: 368, height: 100, sortOrder: "a1" },
      ],
      GAP,
      PADDING,
    )
    expect(result.containerHeight).toBe(256)
  })

  it("empty children returns empty positions with padding-only dims", () => {
    const result = stackChildren([], GAP, PADDING)
    expect(result.children).toEqual([])
    expect(result.containerWidth).toBe(32)
    expect(result.containerHeight).toBe(48)
  })

  it("single child at origin", () => {
    const result = stackChildren(
      [{ id: "a", width: 368, height: 80, sortOrder: "a0" }],
      GAP,
      PADDING,
    )
    expect(result.children).toHaveLength(1)
    expect(result.children[0]).toEqual({ id: "a", x: 16, y: 32 })
  })

  it("skips child without height (defensive)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    const result = stackChildren(
      [
        { id: "a", width: 368, height: 80, sortOrder: "a0" },
        { id: "b", width: 368, height: null as unknown as number, sortOrder: "a1" },
        { id: "c", width: 368, height: 100, sortOrder: "a2" },
      ],
      GAP,
      PADDING,
    )

    expect(warnSpy).toHaveBeenCalledWith('stackChildren: child "b" has no height — skipping')
    expect(result.children).toHaveLength(2)
    expect(result.children[0].id).toBe("a")
    expect(result.children[1].id).toBe("c")

    warnSpy.mockRestore()
  })

  it("sorts by fractional index correctly", () => {
    const result = stackChildren(
      [
        { id: "a", width: 368, height: 80, sortOrder: "a2" },
        { id: "b", width: 368, height: 80, sortOrder: "a0" },
        { id: "c", width: 368, height: 80, sortOrder: "a1" },
      ],
      GAP,
      PADDING,
    )
    expect(result.children.map((c) => c.id)).toEqual(["b", "c", "a"])
  })
})
