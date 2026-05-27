import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, useCallback } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import GraphContextMenu from '@/canvas/GraphContextMenu'

function ContextMenuDemo() {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleClose = useCallback(() => setMenu(null), [])

  return (
    <div
      onContextMenu={handleContextMenu}
      style={{
        width: '100%',
        height: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--muted)',
        borderRadius: 8,
        color: 'var(--muted-foreground)',
        fontSize: 14,
        userSelect: 'none',
      }}
    >
      Right-click anywhere
      <GraphContextMenu
        open={menu !== null}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        items={[
          { label: 'New Node', action: () => {} },
          { label: 'New Group', action: () => {} },
          { label: 'Paste', action: () => {} },
        ]}
        onClose={handleClose}
      />
    </div>
  )
}

const meta = {
  title: 'Canvas/GraphContextMenu',
  component: ContextMenuDemo,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof ContextMenuDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NodeMenu: Story = {
  render: () => (
    <div style={{ position: 'relative', width: '100%', height: 300 }}>
      <GraphContextMenu
        open
        x={200}
        y={100}
        items={[
          { label: 'Metadata: Hidden', action: () => {} },
          { label: 'Add Child Node', action: () => {} },
          { label: 'Add Child Container', action: () => {} },
          { label: 'Detach from Group', action: () => {} },
          { label: 'Edit', action: () => {} },
          { label: 'Delete', action: () => {} },
        ]}
        onClose={() => {}}
      />
    </div>
  ),
}

export const EdgeMenu: Story = {
  render: () => (
    <div style={{ position: 'relative', width: '100%', height: 300 }}>
      <GraphContextMenu
        open
        x={200}
        y={100}
        items={[
          { label: 'Delete Edge', action: () => {} },
        ]}
        onClose={() => {}}
      />
    </div>
  ),
}

export const RightClickInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const target = canvas.getByText('Right-click anywhere')
    await userEvent.pointer({ target, coords: { x: 100, y: 50 }, keys: '[MouseRight]' })
    const menuItem = await canvas.findByText('New Node')
    await expect(menuItem).toBeVisible()
    await userEvent.click(menuItem)
  },
}
