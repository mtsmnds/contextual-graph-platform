import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ContainerCard } from "@/components/ContainerCard"

describe("ContainerCard", () => {
  it("renders children", () => {
    render(<ContainerCard width={400}><span data-testid="child">Content</span></ContainerCard>)
    expect(screen.getByTestId("child")).toBeDefined()
  })

  it("applies width prop", () => {
    render(<ContainerCard width={400} data-testid="card">Hello</ContainerCard>)
    const card = screen.getByTestId("card")
    expect(card.style.width).toBe("400px")
  })

  it("defaults to bordered variant", () => {
    render(<ContainerCard data-testid="card">Hello</ContainerCard>)
    const card = screen.getByTestId("card")
    expect(card.className).toContain("bg-card")
  })

  it("accepts none variant", () => {
    render(<ContainerCard variant="none" data-testid="card">Hello</ContainerCard>)
    const card = screen.getByTestId("card")
    expect(card.className).toContain("bg-transparent")
  })

  it("accepts hover variant", () => {
    render(<ContainerCard variant="hover" data-testid="card">Hello</ContainerCard>)
    const card = screen.getByTestId("card")
    expect(card.className).toContain("hover:bg-card")
  })

  it("composes className and style", () => {
    render(
      <ContainerCard width="100%" className="custom-card" style={{ background: "red" }} data-testid="card">
        Hello
      </ContainerCard>,
    )
    const card = screen.getByTestId("card")
    expect(card.className).toContain("bg-card")
    expect(card.className).toContain("custom-card")
    expect(card.style.background).toBe("red")
  })
})
