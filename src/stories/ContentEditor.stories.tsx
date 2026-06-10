import { useState, createRef } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent } from "storybook/test"
import ContentEditor, { type ContentEditorHandle } from "@/components/ContentEditor"

const meta = {
  title: "Components/ContentEditor",
  component: ContentEditor,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    onChange: fn(),
  },
  argTypes: {
    content: { description: "Text content to display and edit" },
    onChange: { description: "Called with new value on blur commit" },
    editTrigger: { description: "Increment to programmatically enter edit mode" },
    placeholder: { description: "Placeholder text when content is empty" },
  },
} satisfies Meta<typeof ContentEditor>

export default meta
type Story = StoryObj<typeof meta>

/** Default read-only state showing rendered content as a paragraph. */
export const ViewMode: Story = {
  args: {
    content: "Hello World",
  },
}

/** View mode with no content — displays the placeholder text in muted styling. */
export const Empty: Story = {
  args: {
    content: "",
    placeholder: "Type something...",
  },
}

/** Double-clicking the content text opens the editor. The textarea is auto-focused and pre-filled with the current content. */
export const DoubleClickEdit: Story = {
  args: {
    content: "Double-click to edit",
  },
  play: async ({ canvas }) => {
    const text = canvas.getByText("Double-click to edit")
    await userEvent.dblClick(text)
    const textarea = canvas.getByRole("textbox")
    await expect(textarea).toBeVisible()
    await expect(textarea).toHaveValue("Double-click to edit")
  },
}

/** Pressing Escape while editing discards changes and returns to view mode. `onChange` is not called. */
export const EscapeCancels: Story = {
  args: {
    content: "Original content",
  },
  play: async ({ canvas, args }) => {
    await userEvent.dblClick(canvas.getByText("Original content"))
    const textarea = canvas.getByRole("textbox")
    await userEvent.clear(textarea)
    await userEvent.type(textarea, "Changed content")
    await userEvent.keyboard("{Escape}")
    await expect(canvas.getByText("Original content")).toBeVisible()
    await expect(args.onChange).not.toHaveBeenCalled()
  },
}

/** Moving focus away from the textarea (blur) commits the current value via `onChange`. */
export const BlurCommits: Story = {
  args: {
    content: "Blur to commit",
  },
  play: async ({ canvas, args }) => {
    await userEvent.dblClick(canvas.getByText("Blur to commit"))
    const textarea = canvas.getByRole("textbox")
    await userEvent.clear(textarea)
    await userEvent.type(textarea, "Committed text")
    textarea.blur()
    await expect(args.onChange).toHaveBeenCalledWith("Committed text")
  },
}

/** Components holding a ref to `ContentEditorHandle` can call `enterEdit()` imperatively, for example from a toolbar button. */
export const ProgrammaticEdit: Story = {
  render: () => {
    const ref = createRef<ContentEditorHandle>()
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <ContentEditor ref={ref} content="Edit via ref" onChange={fn()} />
        <button data-testid="edit-btn" onClick={() => ref.current?.enterEdit()}>
          Edit
        </button>
      </div>
    )
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByTestId("edit-btn"))
    await expect(canvas.getByRole("textbox")).toBeVisible()
    await expect(canvas.getByRole("textbox")).toHaveValue("Edit via ref")
  },
}

/** Incrementing the `editTrigger` prop opens the editor. Useful after creating a new node or segment. */
export const AutoOpen: Story = {
  render: () => {
    const [trigger, setTrigger] = useState(0)
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <ContentEditor
          content="Click to auto-open"
          onChange={fn()}
          editTrigger={trigger}
        />
        <button data-testid="auto-btn" onClick={() => setTrigger((t) => t + 1)}>
          Auto-open editor
        </button>
      </div>
    )
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByTestId("auto-btn"))
    await expect(canvas.getByRole("textbox")).toBeVisible()
    await expect(canvas.getByRole("textbox")).toHaveValue("Click to auto-open")
  },
}
