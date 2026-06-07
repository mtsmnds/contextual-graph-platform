import type { Meta, StoryObj } from '@storybook/react-vite'
import { ReactFlow, ReactFlowProvider } from '@xyflow/react'
import { expect, userEvent, within } from 'storybook/test'
import '@xyflow/react/dist/style.css'
import EntityNode from '@/canvas/nodes/EntityNode'
import { useGraphStore } from '@/store/useGraphStore'

const nodeTypes = { entity: EntityNode }

const defaultNodes = [
  {
    id: 'entity-1',
    type: 'entity' as const,
    position: { x: 0, y: 0 },
    data: { content: 'Hello World', type: 'concept', id: 'entity-1' },
    style: { width: 208 },
  },
]

function EntityNodeFlow({ nodes = defaultNodes }: { nodes?: typeof defaultNodes }) {
  return (
    <div style={{ width: 500, height: 400, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={nodes}
          fitView
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
        />
      </ReactFlowProvider>
    </div>
  )
}

const meta = {
  title: 'Canvas/EntityNode',
  component: EntityNodeFlow,
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof EntityNodeFlow>

export default meta
type Story = StoryObj<typeof meta>

export const Concept: Story = {}

export const WithLongContent: Story = {
  args: {
    nodes: [
      {
        id: 'entity-1',
        type: 'entity',
        position: { x: 0, y: 0 },
        data: { content: 'A longer piece of text that wraps across multiple lines inside the entity node card', type: 'concept', id: 'entity-1' },
        style: { width: 208 },
      },
    ],
  },
}

export const Empty: Story = {
  args: {
    nodes: [
      {
        id: 'entity-1',
        type: 'entity',
        position: { x: 0, y: 0 },
        data: { content: '', type: 'concept', id: 'entity-1' },
        style: { width: 208 },
      },
    ],
  },
}

export const DoubleClickEdit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const paragraph = canvas.getByText('Hello World')
    await userEvent.dblClick(paragraph)
    const textarea = canvasElement.querySelector('textarea')!
    await expect(textarea).toBeVisible()
    await userEvent.clear(textarea)
    await userEvent.type(textarea, 'Edited via Storybook')
    textarea.blur()
  },
}

export const AutoHeightEnabled: Story = {
  beforeEach: async () => {
    const prevFlags = { ...useGraphStore.getState().featureFlags }
    useGraphStore.setState({
      featureFlags: { ...prevFlags, autoHeight: true },
    })
    return () => {
      useGraphStore.setState({ featureFlags: prevFlags })
    }
  },
  args: {
    nodes: [
      {
        id: 'entity-1',
        type: 'entity',
        position: { x: 0, y: 0 },
        data: {
          content:
            'A much longer piece of content that should cause the card to expand naturally rather than being clipped. When auto-height is enabled, the node grows to fit this text without needing manual resize handles.',
          type: 'concept',
          id: 'entity-1',
        },
        style: { width: 208 },
      },
    ],
  },
}
