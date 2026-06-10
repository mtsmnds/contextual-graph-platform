import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef, act } from "react"
import ContentEditor, { type ContentEditorHandle } from "./ContentEditor"

describe("ContentEditor", () => {
  it("renders content in view mode", () => {
    render(<ContentEditor content="Hello" onChange={() => {}} />)
    expect(screen.getByText("Hello")).toBeDefined()
  })

  it("shows placeholder when content is empty", () => {
    render(<ContentEditor content="" onChange={() => {}} placeholder="Type something..." />)
    expect(screen.getByText("Type something...")).toBeDefined()
  })

  it("enters edit mode on double-click", async () => {
    const user = userEvent.setup()
    render(<ContentEditor content="Hello" onChange={() => {}} />)
    await user.dblClick(screen.getByText("Hello"))
    expect(screen.getByRole("textbox")).toBeDefined()
  })

  it("shows current content in textarea when editing", async () => {
    const user = userEvent.setup()
    render(<ContentEditor content="Hello" onChange={() => {}} />)
    await user.dblClick(screen.getByText("Hello"))
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
    expect(textarea.value).toBe("Hello")
  })

  it("calls onChange on blur", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ContentEditor content="Hello" onChange={onChange} />)
    await user.dblClick(screen.getByText("Hello"))

    const textarea = screen.getByRole("textbox")
    await user.clear(textarea)
    await user.type(textarea, "World")
    await user.click(document.body)

    expect(onChange).toHaveBeenCalledWith("World")
  })

  it("restores original content and exits edit mode on Escape", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ContentEditor content="Original" onChange={onChange} />)
    await user.dblClick(screen.getByText("Original"))

    const textarea = screen.getByRole("textbox")
    await user.clear(textarea)
    await user.type(textarea, "Changed")
    await user.keyboard("{Escape}")

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText("Original")).toBeDefined()
  })

  it("enters edit mode when editTrigger increments", () => {
    const { rerender } = render(<ContentEditor content="Hello" onChange={() => {}} editTrigger={0} />)
    expect(screen.queryByRole("textbox")).toBeNull()

    rerender(<ContentEditor content="Hello" onChange={() => {}} editTrigger={1} />)
    expect(screen.getByRole("textbox")).toBeDefined()
  })

  it("exposes enterEdit via ref", () => {
    const ref = createRef<ContentEditorHandle>()
    render(<ContentEditor ref={ref} content="Hello" onChange={() => {}} />)

    expect(screen.queryByRole("textbox")).toBeNull()
    act(() => { ref.current?.enterEdit() })
    expect(screen.getByRole("textbox")).toBeDefined()
  })
})
