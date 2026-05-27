import type { Meta, StoryObj } from '@storybook/react-vite'
import { ReactFlow, ReactFlowProvider, Handle, Position, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const handlePositions = [
  { position: Position.Top, label: 'Top', style: { top: -8 } },
  { position: Position.Right, label: 'Right', style: { right: -8 } },
  { position: Position.Bottom, label: 'Bottom', style: { bottom: -8 } },
  { position: Position.Left, label: 'Left', style: { left: -8 } },
] as const

function HandleDemoNode({ data }: { data: { type: 'source' | 'target' | 'both' } }) {
  return (
    <div
      style={{
        padding: '20px 32px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        fontSize: 13,
        color: 'var(--foreground)',
        position: 'relative',
      }}
    >
      <span>{data.type === 'source' ? 'Source' : data.type === 'target' ? 'Target' : 'Source & Target'} handles</span>
      {handlePositions.map(({ position, label, style }) => (
        <Handle
          key={label}
          type={data.type === 'both' ? 'source' : data.type}
          position={position}
          id={label.toLowerCase()}
          style={style}
          title={label}
        />
      ))}
    </div>
  )
}

const nodeTypes = { handleDemo: HandleDemoNode }

const defaultNodes: Node[] = [
  { id: '1', type: 'handleDemo', position: { x: 50, y: 50 }, data: { type: 'both' } },
]

function FlowWrapper({ nodes = defaultNodes }: { nodes?: Node[] }) {
  return (
    <div style={{ width: 400, height: 300, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
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
  title: 'Canvas/BaseHandle',
  component: FlowWrapper,
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof FlowWrapper>

export default meta
type Story = StoryObj<typeof meta>

export const SourceAndTarget: Story = {}

export const SourceOnly: Story = {
  args: {
    nodes: [
      { id: '1', type: 'handleDemo', position: { x: 50, y: 50 }, data: { type: 'source' } },
    ],
  },
}

export const TargetOnly: Story = {
  args: {
    nodes: [
      { id: '1', type: 'handleDemo', position: { x: 50, y: 50 }, data: { type: 'target' } },
    ],
  },
}

export const ConnectedNodePair: Story = {
  args: {
    nodes: [
      { id: '1', type: 'handleDemo', position: { x: 20, y: 80 }, data: { type: 'source' } },
      { id: '2', type: 'handleDemo', position: { x: 220, y: 80 }, data: { type: 'target' } },
    ],
  },
}
