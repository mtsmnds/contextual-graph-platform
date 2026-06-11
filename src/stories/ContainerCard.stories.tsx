import type { Meta, StoryObj } from "@storybook/react-vite"
import { ContainerCard } from "@/components/ContainerCard"
import { SegmentCard } from "@/components/SegmentCard"

const meta = {
  title: "Components/ContainerCard",
  component: ContainerCard,
  parameters: { layout: "centered" },
  tags: ["autodocs", "ai-generated"],
  argTypes: {
    width: {
      description: "Fixed width of the card (number or CSS string)",
      control: "text",
    },
    variant: {
      description: "Visual variant of the card",
      control: "select",
      options: ["bordered", "none", "hover"],
    },
  },
} satisfies Meta<typeof ContainerCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ContainerCard width={400}>
      <div className="font-semibold text-sm px-3 py-2">Container Title</div>
      <div className="flex-1 min-h-[60px] bg-accent/15 px-3 py-2">
        <p className="text-muted-foreground text-sm">Child area</p>
      </div>
    </ContainerCard>
  ),
}

export const WithSegmentChildren: Story = {
  render: () => (
    <ContainerCard width={400}>
      <div className="font-semibold text-sm px-3 py-2">Act I</div>
      <div className="flex flex-col gap-2 flex-1 min-h-[60px] bg-accent/15 p-3">
        <SegmentCard width="100%">First segment content</SegmentCard>
        <SegmentCard width="100%">Second segment content</SegmentCard>
        <SegmentCard width="100%">Third segment content</SegmentCard>
      </div>
    </ContainerCard>
  ),
}

export const VariantNone: Story = {
  render: () => (
    <ContainerCard width={400} variant="none">
      <div className="font-semibold text-sm px-3 py-2">No border, transparent background</div>
      <div className="flex-1 min-h-[60px] px-3 py-2">
        <p className="text-muted-foreground text-sm">Inline content without card frame</p>
      </div>
    </ContainerCard>
  ),
}
