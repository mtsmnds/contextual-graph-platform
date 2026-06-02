import type { Meta, StoryObj } from "@storybook/react-vite"
import { EntityForm } from "../components/entity-form/EntityForm"
import { useGraphStore } from "../store/useGraphStore"
import type { Entity, Relation } from "../types/graph"

const sampleEntities: Entity[] = [
  { id: "root-1", type: "container", content: "My Project", metadata: {}, createdAt: 1, updatedAt: 1, canvasData: { x: 0, y: 0 } },
  { id: "root-2", type: "container", content: "Another Workspace", metadata: {}, createdAt: 2, updatedAt: 2, canvasData: { x: 0, y: 0 } },
  { id: "seg-1", type: "segment", content: "First segment", metadata: { lineNumber: 1 }, createdAt: 3, updatedAt: 3, canvasData: { x: 0, y: 0 } },
  { id: "seg-2", type: "segment", content: "Second segment", metadata: { lineNumber: 2, character: "Hamlet" }, createdAt: 4, updatedAt: 4, canvasData: { x: 0, y: 0 } },
  { id: "conc-1", type: "concept", content: "Revenge", metadata: {}, createdAt: 5, updatedAt: 5, canvasData: { x: 0, y: 0 } },
] as Entity[]

const sampleRelations: Relation[] = [
  { id: "rel-1", source: "root-1", target: "seg-1", type: "contains", sortOrder: "a0", metadata: {} },
  { id: "rel-2", source: "root-1", target: "seg-2", type: "contains", sortOrder: "a1", metadata: {} },
  { id: "rel-3", source: "conc-1", target: "seg-1", type: "related_to", sortOrder: "a0", metadata: {} },
] as Relation[]

function StoryForm(props: {
  onSubmit?: (entityId: string) => void
  defaultParentId?: string
}) {
  useGraphStore.setState({ entities: sampleEntities, relations: sampleRelations })
  return (
    <div className="w-[380px] p-4">
      <EntityForm {...props} />
    </div>
  )
}

const meta = {
  title: "Entity Form/EntityForm",
  component: StoryForm,
  parameters: { layout: "centered" },
  tags: ["autodocs", "ai-generated"],
} satisfies Meta<typeof StoryForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithDefaultParent: Story = {
  args: { defaultParentId: "root-1" },
}
