import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import ZoomControls from '@/canvas/panels/ZoomControls'

const meta = {
  title: 'Buttons & Sidebar/ZoomControls',
  component: ZoomControls,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    onZoomIn: fn(),
    onZoomOut: fn(),
    onFitView: fn(),
    onZoom100: fn(),
  },
} satisfies Meta<typeof ZoomControls>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
