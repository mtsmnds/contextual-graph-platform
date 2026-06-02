import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { RelationsSection } from "../components/entity-form/RelationsSection"
import { useGraphStore } from "../store/useGraphStore"
import type { Entity, Relation } from "../types/graph"
import type { RelationRow } from "../components/entity-form/RelationEditor"

const sampleEntities: Entity[] = [
  { id: "root-1", type: "container", content: "My Project", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } },
  { id: "seg-1", type: "segment", content: "First segment", metadata: {}, createdAt: 2, updatedAt: 2, canvasData: { x: 0, y: 0 } },
  { id: "conc-1", type: "concept", content: "Theme", metadata: {}, createdAt: 3, updatedAt: 3, canvasData: { x: 0, y: 0 } },
] as Entity[]

const sampleRelations: Relation[] = [
  { id: "rel-1", source: "root-1", target: "seg-1", type: "contains", sortOrder: "a0", metadata: {} },
] as Relation[]

function RelationsSectionDemo() {
  const [relations, setRelations] = useState<RelationRow[]>([])
  useGraphStore.setState({ entities: sampleEntities, relations: sampleRelations })
  return (
    <div className="w-[380px] p-4">
      <RelationsSection relations={relations} onChange={setRelations} />
    </div>
  )
}

const meta = {
  title: "Entity Form/RelationsSection",
  component: RelationsSectionDemo,
  parameters: { layout: "centered" },
  tags: ["autodocs", "ai-generated"],
} satisfies Meta<typeof RelationsSectionDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
