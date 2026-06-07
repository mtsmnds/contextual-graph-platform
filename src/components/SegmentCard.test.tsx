import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SegmentCard } from "@/components/SegmentCard"

describe("SegmentCard", () => {
  it("renders at given width", () => {
    render(<SegmentCard width={208} data-testid="card">Hello</SegmentCard>)
    const card = screen.getByTestId("card")
    expect(card.style.width).toBe("208px")
  })

  it("renders children", () => {
    render(<SegmentCard width={208}><span data-testid="child">Content</span></SegmentCard>)
    expect(screen.getByTestId("child")).toBeDefined()
  })

  it("applies className and style", () => {
    render(
      <SegmentCard width="100%" className="custom-card" style={{ background: "red" }} data-testid="card">
        Hello
      </SegmentCard>,
    )
    const card = screen.getByTestId("card")
    expect(card.className).toContain("segment-card")
    expect(card.className).toContain("custom-card")
    expect(card.style.background).toBe("red")
  })
})
