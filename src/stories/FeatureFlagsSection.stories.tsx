import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import FeatureFlagsSection from '@/canvas/panels/sections/FeatureFlagsSection'
import { withSidebarSection } from '../../.storybook/decorators'

const meta = {
  title: 'Canvas/Sidebar/FeatureFlagsSection',
  component: FeatureFlagsSection,
  decorators: [withSidebarSection],
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof FeatureFlagsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ToggleFlag: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole('switch')
    await userEvent.click(toggle)
    await expect(toggle).toBeChecked()
    await userEvent.click(toggle)
    await expect(toggle).not.toBeChecked()
  },
}
