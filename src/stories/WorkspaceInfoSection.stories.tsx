import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import WorkspaceInfoSection from '@/canvas/panels/sections/WorkspaceInfoSection'
import { withSidebarSection } from '../../.storybook/decorators'

const meta = {
  title: 'Buttons & Sidebar/WorkspaceInfoSection',
  component: WorkspaceInfoSection,
  decorators: [withSidebarSection],
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
  args: {
    folderName: null,
    entityCount: 0,
    undoStack: [],
    redoStack: [],
    onUndo: fn(),
    onRedo: fn(),
  },
} satisfies Meta<typeof WorkspaceInfoSection>

export default meta
type Story = StoryObj<typeof meta>

export const WithViewport: Story = {
  args: { viewport: { x: 725, y: 396.5, zoom: 1 } },
}

export const WithoutViewport: Story = {}
