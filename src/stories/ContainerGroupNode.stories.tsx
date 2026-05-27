import type { Meta, StoryObj } from '@storybook/react-vite'
import { ReactFlow, ReactFlowProvider } from '@xyflow/react'
import { expect, userEvent, within } from 'storybook/test'
import '@xyflow/react/dist/style.css'
import ContainerGroupNode from '@/canvas/nodes/ContainerGroupNode'

const nodeTypes = { containerGroup: ContainerGroupNode }

const defaultNodes = [
  {
    id: 'container-1',
    type: 'containerGroup' as const,
    position: { x: 0, y: 0 },
    data: { content: 'My Container', id: 'container-1' },
    style: { width: 400 },
  },
]

function ContainerNodeFlow({ nodes = defaultNodes }: { nodes?: typeof defaultNodes }) {
  return (
    <div style={{ width: 600, height: 500, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
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
  title: 'Canvas/ContainerGroupNode',
  component: ContainerNodeFlow,
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof ContainerNodeFlow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const EmptyTitle: Story = {
  args: {
    nodes: [
      {
        id: 'container-1',
        type: 'containerGroup',
        position: { x: 0, y: 0 },
        data: { content: '', id: 'container-1' },
        style: { width: 400 },
      },
    ],
  },
}

export const DoubleClickEdit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const title = canvas.getByText('My Container')
    await userEvent.dblClick(title)
    const input = canvasElement.querySelector('input')!
    await expect(input).toBeVisible()
    await userEvent.clear(input)
    await userEvent.type(input, 'Renamed Container')
    input.blur()
  },
}
