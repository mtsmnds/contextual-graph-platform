import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent } from "storybook/test"
import { SegmentCard } from "@/components/SegmentCard"
import ContentEditor from "@/components/ContentEditor"

const LONG_CONTENT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`

const meta = {
  title: "Components/SegmentCard",
  component: SegmentCard,
  parameters: { layout: "centered" },
  tags: ["autodocs", "ai-generated"],
  argTypes: {
    width: {
      description: "Fixed width of the card (number or CSS string)",
      control: "text",
    },
  },
} satisfies Meta<typeof SegmentCard>

export default meta
type Story = StoryObj<typeof meta>

export const ShortContent: Story = {
  render: () => (
    <SegmentCard width={208}>
      <ContentEditor content="Hello World" onChange={fn()} />
    </SegmentCard>
  ),
}

export const LongContent: Story = {
  render: () => (
    <SegmentCard width={208}>
      <ContentEditor content={LONG_CONTENT} onChange={fn()} />
    </SegmentCard>
  ),
}

export const EmptyContent: Story = {
  render: () => (
    <SegmentCard width={208}>
      <ContentEditor content="" placeholder="Type here..." onChange={fn()} />
    </SegmentCard>
  ),
}

export const CustomWidth: Story = {
  render: () => (
    <SegmentCard width={400}>
      <ContentEditor content="This card has a wider fixed width of 400px" onChange={fn()} />
    </SegmentCard>
  ),
}

export const PaddingDefault: Story = {
  name: "PaddingDefault",
  render: () => (
    <SegmentCard width={300} className="border border-red-500">
      <span>Default padding (p-3 = 12px all sides)</span>
    </SegmentCard>
  ),
}

export const EditableContent: Story = {
  render: () => (
    <SegmentCard width={208}>
      <ContentEditor content="Double-click to edit inside the card" onChange={fn()} />
    </SegmentCard>
  ),
  play: async ({ canvas }) => {
    const text = canvas.getByText("Double-click to edit inside the card")
    await userEvent.dblClick(text)
    const textarea = canvas.getByRole("textbox")
    await expect(textarea).toBeVisible()
    await expect(textarea).toHaveValue("Double-click to edit inside the card")
  },
}
