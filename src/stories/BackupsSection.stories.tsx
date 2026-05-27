import type { Meta, StoryObj } from '@storybook/react-vite'
import BackupsSection from '@/canvas/panels/sections/BackupsSection'
import { withSidebarSection } from '../../.storybook/decorators'

const meta = {
  title: 'Canvas/Sidebar/BackupsSection',
  component: BackupsSection,
  decorators: [withSidebarSection],
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof BackupsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
