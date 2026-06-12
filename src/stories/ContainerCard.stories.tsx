import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { ContainerCard } from "@/components/ContainerCard"
import { SegmentCard } from "@/components/SegmentCard"
import ContentEditor from "@/components/ContentEditor"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { CaretDown } from "@phosphor-icons/react"

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
    <ContainerCard
      width={400}
      header={<ContentEditor content="Container Title" className="font-semibold text-sm" onChange={fn()} placeholder="Untitled" />}
    >
      <div className="flex flex-col gap-2 flex-1 min-h-[60px] bg-accent/15 p-3">
        <p className="text-muted-foreground text-sm">Child area</p>
      </div>
    </ContainerCard>
  ),
}

export const WithSegmentChildren: Story = {
  render: () => (
    <ContainerCard
      width={400}
      header={<ContentEditor content="Act I" className="font-semibold text-sm" onChange={fn()} placeholder="Untitled" />}
    >
      <div className="flex flex-col gap-2 flex-1 min-h-[60px] bg-accent/15 p-3">
        <SegmentCard width="100%">
          <ContentEditor content="First segment content" onChange={fn()} placeholder="Type here..." />
        </SegmentCard>
        <SegmentCard width="100%">
          <ContentEditor content="Second segment content" onChange={fn()} placeholder="Type here..." />
        </SegmentCard>
        <SegmentCard width="100%">
          <ContentEditor content="Third segment content" onChange={fn()} placeholder="Type here..." />
        </SegmentCard>
      </div>
    </ContainerCard>
  ),
}

export const VariantNone: Story = {
  render: () => (
    <ContainerCard
      width={400}
      variant="none"
      header={<ContentEditor content="No border, transparent background" className="font-semibold text-sm" onChange={fn()} placeholder="Untitled" />}
    >
      <p className="text-muted-foreground text-sm">Inline content without card frame</p>
    </ContainerCard>
  ),
}

export const VariantNoneWithSegments: Story = {
  render: () => (
    <ContainerCard
      width={400}
      variant="none"
      header={<ContentEditor content="Act I" className="font-semibold text-sm" onChange={fn()} placeholder="Untitled" />}
    >
      <div className="flex flex-col gap-2 flex-1 min-h-[60px] p-3">
        <SegmentCard width="100%" variant="none">
          <ContentEditor content="First segment content" onChange={fn()} placeholder="Type here..." />
        </SegmentCard>
        <SegmentCard width="100%" variant="none">
          <ContentEditor content="Second segment content" onChange={fn()} placeholder="Type here..." />
        </SegmentCard>
      </div>
    </ContainerCard>
  ),
}

export const CollapsibleOpen: Story = {
  render: () => (
    <Collapsible defaultOpen>
      <ContainerCard
        width={400}
        header={
          <div className="flex items-center gap-2">
            <ContentEditor content="Act I" className="font-semibold text-sm flex-1" onChange={fn()} placeholder="Untitled" />
            <CollapsibleTrigger className="p-1 rounded hover:bg-accent cursor-pointer text-muted-foreground transition-transform data-[open]:rotate-0 -rotate-90">
              <CaretDown size={14} />
            </CollapsibleTrigger>
          </div>
        }
      >
        <CollapsibleContent className="flex flex-col gap-2 flex-1 min-h-[60px] bg-accent/15 p-3">
          <SegmentCard width="100%">
            <ContentEditor content="First segment" onChange={fn()} />
          </SegmentCard>
          <SegmentCard width="100%">
            <ContentEditor content="Second segment" onChange={fn()} />
          </SegmentCard>
        </CollapsibleContent>
      </ContainerCard>
    </Collapsible>
  ),
}

export const CollapsibleClosed: Story = {
  render: () => (
    <Collapsible>
      <ContainerCard
        width={400}
        header={
          <div className="flex items-center gap-2">
            <ContentEditor content="Act I" className="font-semibold text-sm flex-1" onChange={fn()} placeholder="Untitled" />
            <CollapsibleTrigger className="p-1 rounded hover:bg-accent cursor-pointer text-muted-foreground transition-transform data-[open]:rotate-0 -rotate-90">
              <CaretDown size={14} />
            </CollapsibleTrigger>
          </div>
        }
      >
        <CollapsibleContent className="flex flex-col gap-2 flex-1 min-h-[60px] bg-accent/15 p-3">
          <SegmentCard width="100%">
            <ContentEditor content="First segment" onChange={fn()} />
          </SegmentCard>
          <SegmentCard width="100%">
            <ContentEditor content="Second segment" onChange={fn()} />
          </SegmentCard>
        </CollapsibleContent>
      </ContainerCard>
    </Collapsible>
  ),
}
