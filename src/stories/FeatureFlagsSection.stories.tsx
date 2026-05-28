import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, fn } from 'storybook/test'
import FeatureFlagsSection from '@/canvas/panels/sections/FeatureFlagsSection'
import { withSidebarSection } from '../../.storybook/decorators'

const meta = {
  title: 'Buttons & Sidebar/FeatureFlagsSection',
  component: FeatureFlagsSection,
  decorators: [withSidebarSection],
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
  args: {
    flags: { dragToNest: true },
    onToggle: fn(),
  },
} satisfies Meta<typeof FeatureFlagsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ToggleFlag: Story = {
  render: function ToggleFlagStory() {
    const [flags, setFlags] = useState({ dragToNest: true })
    return (
      <FeatureFlagsSection
        flags={flags}
        onToggle={(key, value) => setFlags((prev) => ({ ...prev, [key]: value }))}
      />
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole('switch')
    await expect(toggle).toBeChecked()
    await userEvent.click(toggle)
    await expect(toggle).not.toBeChecked()
    await userEvent.click(toggle)
    await expect(toggle).toBeChecked()
  },
}
