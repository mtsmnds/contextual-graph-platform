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

  it("has flex column layout with gap and padding", () => {
    render(<SegmentCard width={208} data-testid="card">Content</SegmentCard>)
    const card = screen.getByTestId("card")
    expect(card.className).toContain("flex")
    expect(card.className).toContain("flex-col")
    expect(card.className).toContain("gap-y-2")
    expect(card.className).toContain("p-3")
  })

  it("defaults to bordered variant", () => {
    render(<SegmentCard width={208} data-testid="card">Hello</SegmentCard>)
    const card = screen.getByTestId("card")
    expect(card.className).toContain("bg-card")
  })

  it("accepts bordered variant", () => {
    render(<SegmentCard width={208} variant="bordered" data-testid="card">Hello</SegmentCard>)
    const card = screen.getByTestId("card")
    expect(card.className).toContain("bg-card")
  })

  it("accepts none variant", () => {
    render(<SegmentCard width={208} variant="none" data-testid="card">Hello</SegmentCard>)
    const card = screen.getByTestId("card")
    expect(card.className).toContain("bg-transparent")
  })

  it("accepts hover variant", () => {
    render(<SegmentCard width={208} variant="hover" data-testid="card">Hello</SegmentCard>)
    const card = screen.getByTestId("card")
    expect(card.className).toContain("hover:bg-card")
  })

  it("applies className and style", () => {
    render(
      <SegmentCard width="100%" className="custom-card" style={{ background: "red" }} data-testid="card">
        Hello
      </SegmentCard>,
    )
    const card = screen.getByTestId("card")
    expect(card.className).toContain("bg-card")
    expect(card.className).toContain("custom-card")
    expect(card.style.background).toBe("red")
  })
})
