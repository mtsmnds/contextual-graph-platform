import type { Meta, StoryObj } from '@storybook/react-vite'
import WorkspaceInfoSection from '@/canvas/panels/sections/WorkspaceInfoSection'
import { withSidebarSection } from '../../.storybook/decorators'

const meta = {
  title: 'Buttons & Sidebar/WorkspaceInfoSection',
  component: WorkspaceInfoSection,
  decorators: [withSidebarSection],
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    folderName: null,
    entityCount: 0,
  },
} satisfies Meta<typeof WorkspaceInfoSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithFolder: Story = {
  args: { folderName: "hello", entityCount: 7 },
}
