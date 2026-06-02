import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, fn } from 'storybook/test'
import CanvasLayoutSection from '@/canvas/panels/sections/CanvasLayoutSection'
import { withSidebarSection } from '../../.storybook/decorators'
import { DEFAULT_LAYOUT_OPTIONS } from '@/engine/layout'

const meta = {
  title: 'Buttons & Sidebar/CanvasLayoutSection',
  component: CanvasLayoutSection,
  decorators: [withSidebarSection],
  parameters: { layout: 'centered' },
  tags: ['autodocs', 'ai-generated'],
  args: {
    options: { ...DEFAULT_LAYOUT_OPTIONS },
    onChange: fn(),
    onRunLayout: fn(),
  },
} satisfies Meta<typeof CanvasLayoutSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ChangeDirection: Story = {
  args: {
    options: { ...DEFAULT_LAYOUT_OPTIONS, rankdir: "TB" },
  },
}

export const AdjustSpacing: Story = {
  render: function AdjustSpacingStory() {
    const [options, setOptions] = useState({ ...DEFAULT_LAYOUT_OPTIONS })
    return (
      <CanvasLayoutSection
        options={options}
        onChange={(update) => setOptions((prev) => ({ ...prev, ...update }))}
        onRunLayout={fn()}
      />
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const inputs = canvas.getAllByRole('spinbutton')
    const nodeSpacing = inputs[0]
    await userEvent.clear(nodeSpacing)
    await userEvent.type(nodeSpacing, '120')
    await expect(nodeSpacing).toHaveValue(120)
  },
}

export const RunLayout: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Run Layout' })
    await userEvent.click(button)
    await expect(args.onRunLayout).toHaveBeenCalledOnce()
  },
}
